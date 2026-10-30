"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VIDEO, fmt, fmtPacks, sameConfig, tap, type Config } from "./config";
import Histogram, { type Marker, type Series } from "./Histogram";
import { easyPacks, expectedPacks, makeSpec } from "./math";
import { SoloSim, SwapSim, beatenShare, binCounts, drive, makeAxis, summarize, type Axis, type Summary } from "./sim";
import { CORAL, CYAN, DEEP, DISPLAY, GOLD, INK, LABEL, MINT, MUTED, WHITE, rgba } from "./video";

const TOTAL = 10000;
const GROUPS = 300;
const BINS = 36;

type SoloView = { running: boolean; done: number; axis: Axis | null; counts: number[]; summary: Summary | null; share: number | null };

type SwapView = { running: boolean; done: number; axis: Axis | null; alone: number[]; swap: number[]; aloneSum: Summary | null; swapSum: Summary | null; friends: number };

const idleSolo: SoloView = { running: false, done: 0, axis: null, counts: [], summary: null, share: null };

function Stat({ label, value, color = WHITE }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl px-2 py-2 text-center" style={{ background: rgba(DEEP, 0.9) }}>
      <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: MUTED, ...LABEL }}>
        {label}
      </p>
      <p className="text-lg leading-6" style={{ color, fontVariantNumeric: "tabular-nums", ...DISPLAY }}>
        {value}
      </p>
    </div>
  );
}

function RunButton({ running, label, onStart, onStop }: { running: boolean; label: string; onStart: () => void; onStop: () => void }) {
  return (
    <button
      type="button"
      onClick={running ? onStop : onStart}
      className="h-12 w-full rounded-full text-base transition active:scale-[0.98]"
      style={{ background: rgba(running ? CORAL : GOLD, 0.95), boxShadow: `0 0 20px ${rgba(running ? CORAL : GOLD, 0.35)}`, color: INK, ...DISPLAY }}
    >
      {running ? "Stop" : label}
    </button>
  );
}

function Bar({ value, max, tone }: { value: number; max: number; tone: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full" style={{ background: rgba(DEEP, 0.9) }}>
      <div className={`h-full rounded-full transition-[width] duration-150 ${tone}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

export default function SimPanel({ config, yourPacks, active }: { config: Config; yourPacks: number | null; active: boolean }) {
  const spec = useMemo(() => makeSpec(config), [config]);
  const expected = useMemo(() => expectedPacks(spec), [spec]);
  const easy = easyPacks(spec);
  const isVideo = sameConfig({ ...config, friends: 0 }, { n: VIDEO.n, k: VIDEO.k, rareEvery: 0, friends: 0 });

  const [solo, setSolo] = useState<SoloView>(idleSolo);
  const [swap, setSwap] = useState<SwapView | null>(null);
  const [friendsN, setFriendsN] = useState(config.friends > 0 ? config.friends : 3);
  const stopSolo = useRef<(() => void) | null>(null);
  const stopSwap = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!active) return;
    return () => {
      stopSolo.current?.();
      stopSwap.current?.();
    };
  }, [active]);

  const startSolo = () => {
    tap();
    stopSolo.current?.();
    const sim = new SoloSim(spec, TOTAL);
    const marks = [150, 500, 1500, 4000, TOTAL];
    let axis: Axis | null = null;
    let level = -1;
    let lastSummary = 0;
    let summary: Summary | null = null;
    setSolo({ ...idleSolo, running: true });
    stopSolo.current = drive(sim, () => {
      const done = sim.done;
      let next = level;
      while (next + 1 < marks.length && done >= marks[next + 1]) next++;
      if (next !== level && done >= marks[0]) {
        level = next;
        axis = makeAxis([{ values: sim.results, count: done }], BINS, sim.finished ? 0 : 0.4);
      }
      const now = performance.now();
      if (sim.finished || (done >= marks[0] && now - lastSummary > 260)) {
        summary = summarize(sim.results, done);
        lastSummary = now;
      }
      setSolo({
        running: !sim.finished,
        done,
        axis,
        counts: axis ? binCounts(sim.results, done, axis) : [],
        summary,
        share: sim.finished && yourPacks !== null ? beatenShare(sim.results, done, yourPacks) : null,
      });
    });
  };

  const stopSoloRun = () => {
    tap();
    stopSolo.current?.();
    setSolo((s) => ({ ...s, running: false }));
  };

  const startSwap = () => {
    tap();
    stopSwap.current?.();
    const sim = new SwapSim(spec, friendsN, GROUPS);
    const marks = [30, 90, GROUPS];
    let axis: Axis | null = null;
    let level = -1;
    setSwap({ running: true, done: 0, axis: null, alone: [], swap: [], aloneSum: null, swapSum: null, friends: friendsN });
    stopSwap.current = drive(sim, () => {
      const groups = sim.done;
      const count = sim.samples;
      let next = level;
      while (next + 1 < marks.length && groups >= marks[next + 1]) next++;
      if (next !== level && groups >= marks[0]) {
        level = next;
        axis = makeAxis(
          [
            { values: sim.alone, count },
            { values: sim.swap, count },
          ],
          BINS,
          sim.finished ? 0 : 0.4,
        );
      }
      setSwap({
        running: !sim.finished,
        done: groups,
        axis,
        alone: axis ? binCounts(sim.alone, count, axis) : [],
        swap: axis ? binCounts(sim.swap, count, axis) : [],
        aloneSum: count > 0 ? summarize(sim.alone, count) : null,
        swapSum: count > 0 ? summarize(sim.swap, count) : null,
        friends: friendsN,
      });
    });
  };

  const stopSwapRun = () => {
    tap();
    stopSwap.current?.();
    setSwap((s) => (s ? { ...s, running: false } : s));
  };

  const soloMarkers: Marker[] = [];
  if (solo.summary) soloMarkers.push({ at: solo.summary.mean, label: `average: ${fmtPacks(solo.summary.mean)}`, color: GOLD });
  soloMarkers.push({ at: easy, label: `easy math: ${fmt(easy)} packs is way over here`, color: CYAN });
  if (yourPacks !== null) soloMarkers.push({ at: yourPacks, label: `you: ${fmt(yourPacks)}`, color: MINT });
  const soloSeries: Series[] = [{ counts: solo.counts, color: MINT, opacity: 1, label: "Collectors" }];
  const s = solo.summary;

  const swapSeries: Series[] = swap ? [
    { counts: swap.alone, color: "#FF5C7A", opacity: 0.6, label: "Alone" },
    { counts: swap.swap, color: CYAN, opacity: 0.75, label: "Swapping" },
  ] : [];
  const fewer = swap?.aloneSum && swap.swapSum && swap.aloneSum.mean > 0 ? 1 - swap.swapSum.mean / swap.aloneSum.mean : null;

  return (
    <div className="space-y-5 pb-2 text-sm">
      <section className="space-y-3">
        <p className="text-[13px] leading-snug text-mist">
          {fmt(TOTAL)} collectors each open packs until their album of <span className="font-bold text-ink">{fmt(spec.n)}</span> is full ({spec.k} per pack
          {spec.nr > 0 ? `, every ${spec.rareEvery}th sticker rare` : ""}). No swapping.
        </p>
        <RunButton running={solo.running} label={`Run ${fmt(TOTAL)} albums`} onStart={startSolo} onStop={stopSoloRun} />
        {(solo.running || solo.done > 0) && (
          <div className="space-y-1">
            <Bar value={solo.done} max={TOTAL} tone="bg-mint" />
            <p className="num text-right text-[11px] text-mist">
              {fmt(solo.done)} / {fmt(TOTAL)} albums
            </p>
          </div>
        )}
        <Histogram axis={solo.axis} series={soloSeries} markers={soloMarkers} colorRef={expected} />
        {s && (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              <Stat label="Average" value={fmtPacks(s.mean)} color={GOLD} />
              <Stat label="Median" value={fmtPacks(s.median)} />
              <Stat label="Formula" value={`≈ ${fmtPacks(expected)}`} color={CYAN} />
              <Stat label="Luckiest" value={fmt(s.min)} color={MINT} />
              <Stat label="Middle 80%" value={`${fmt(Math.round(s.p10))}–${fmt(Math.round(s.p90))}`} />
              <Stat label="Unluckiest" value={fmt(s.max)} color={CORAL} />
            </div>
            <p className="text-[12px] leading-snug text-mist">
              Average cost at ${VIDEO.price} a pack: <span className="font-bold text-ink">${fmt(Math.round(s.mean * VIDEO.price))}</span>. Easy math said ${fmt(easy * VIDEO.price)}.
              {solo.share !== null && yourPacks !== null && (
                <>
                  {" "}
                  Your {fmt(yourPacks)} packs beat <span className="font-bold text-mint">{Math.round(solo.share * 100)}%</span> of them.
                </>
              )}
            </p>
            {isVideo && (
              <p className="rounded-2xl px-3 py-2 text-[12px] leading-snug" style={{ background: rgba(CYAN, 0.1), color: CYAN, boxShadow: `0 0 0 1px ${rgba(CYAN, 0.25)}` }}>
                In the video, {fmt(VIDEO.collectors)} collectors averaged {fmt(VIDEO.meanPacks)} packs (median {fmt(VIDEO.medianPacks)}). Easy math said {VIDEO.easyPacks} packs (${VIDEO.easyCost}).
              </p>
            )}
          </>
        )}
      </section>

      <section className="space-y-3 border-t border-edge/20 pt-4">
        <h3 className="display text-lg font-black">Swap with friends</h3>
        <p className="text-[13px] leading-snug text-mist">
          Everyone opens a pack each round, then swaps doubles one for one. A friend with a full album gives their doubles away. We play {fmt(GROUPS)} groups and compare with collecting alone.
        </p>
        <div role="group" aria-label="Number of friends" className="grid grid-cols-5 gap-1 rounded-2xl bg-navy-950/55 p-1 ring-1 ring-edge/20">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={friendsN === v}
              onClick={() => {
                tap();
                setFriendsN(v);
              }}
              className={`h-11 rounded-xl text-[13px] font-bold transition active:scale-95 ${friendsN === v ? "bg-ink text-navy-950" : "text-mist"}`}
            >
              {v} friend{v > 1 ? "s" : ""}
            </button>
          ))}
        </div>
        <RunButton running={Boolean(swap?.running)} label="Run the swap test" onStart={startSwap} onStop={stopSwapRun} />
        {swap && (
          <>
            <Bar value={swap.done} max={GROUPS} tone="bg-cyan" />
            <Histogram axis={swap.axis} series={swapSeries} markers={[]} />
            <div className="flex justify-center gap-4 text-[11px] font-semibold">
              <span style={{ color: CORAL }}>■ Alone</span>
              <span style={{ color: CYAN }}>■ With {swap.friends} friend{swap.friends > 1 ? "s" : ""}</span>
            </div>
            {swap.aloneSum && swap.swapSum && (
              <div className="grid grid-cols-3 gap-1.5">
                <Stat label="Alone" value={fmtPacks(swap.aloneSum.mean)} color={CORAL} />
                <Stat label="Swapping" value={fmtPacks(swap.swapSum.mean)} color={CYAN} />
                <Stat label="Fewer packs" value={fewer !== null ? `${Math.round(fewer * 100)}%` : "-"} color={MINT} />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
