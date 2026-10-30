"use client";

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState, type ReactNode } from "react";
import type { CrunchyMood } from "@/components/Crunchy";
import Sheet from "@/components/Sheet";
import { useAccess } from "@/components/access/AccessProvider";
import { COINS, FREE, analyzeAsync, fmt, levelInfo, realCoin, trailingRun } from "./engine";
import type { FlipCount, Level, Metric, Side } from "./engine";
import { hint, shareLine, words as verdictWords } from "./copy";
import CoinPad from "./CoinPad";
import FlipGrid, { cellRect } from "./FlipGrid";
import { SCAN_MS, copyText, toss } from "./fx";
import { Actions, ChartCard, RealPanel } from "./ResultPanel";
import SettingsPanel from "./SettingsPanel";
import { ChartSkeleton, Counter, Host, Panel, TuneIcon } from "./Parts";
import { initial, reducer } from "./state";
import { useBest } from "./useBest";

type Copy = { state: "idle" | "ok" | "fail"; text: string };

export default function CoinLab() {
  const { unlocked } = useAccess();
  const [settings, setSettings] = useState<{ n: FlipCount; level: Level }>({ n: 20, level: "standard" });
  const cfg = unlocked ? settings : FREE;
  const [s, dispatch] = useReducer(reducer, initial);
  const [sheet, setSheet] = useState(false);
  const [chart, setChart] = useState<Metric>("switches");
  const [look, setLook] = useState({ x: 0, y: 0.6 });
  const [copy, setCopy] = useState<Copy>({ state: "idle", text: "" });
  const gridEl = useRef<SVGSVGElement>(null);
  const tap = useRef<{ rect: DOMRect; side: Side } | null>(null);
  const prevLen = useRef(0);
  const [best, saveBest] = useBest(`${s.n}-${s.level}`);

  const a = s.analysis;
  const j = a ? a.you : null;
  const typing = s.phase === "typing";
  const result = s.phase === "result";
  const activeChart: Metric = unlocked ? chart : "switches";

  useLayoutEffect(() => {
    const len = s.flips.length;
    const grew = len > prevLen.current;
    prevLen.current = len;
    const t = tap.current;
    tap.current = null;
    const svg = gridEl.current;
    if (!grew || !t || !svg) return;
    toss(t.rect, cellRect(svg, len - 1, s.n), t.side);
  }, [s.flips, s.n]);

  useEffect(() => {
    if (s.phase !== "crunching" || s.analysis) return;
    let alive = true;
    const id = window.setTimeout(() => {
      analyzeAsync(s.flips, s.n, s.level).then((analysis) => {
        if (alive) dispatch({ type: "analyzed", analysis });
      });
    }, 320);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [s.phase, s.analysis, s.flips, s.n, s.level]);

  useEffect(() => {
    if (unlocked && s.streak > best) saveBest(s.streak);
  }, [unlocked, s.streak, best, saveBest]);

  useEffect(() => {
    if (copy.state !== "ok") return;
    const id = window.setTimeout(() => setCopy({ state: "idle", text: "" }), 2200);
    return () => window.clearTimeout(id);
  }, [copy.state]);

  const onFlip = useCallback((side: Side, rect: DOMRect) => {
    tap.current = { rect, side };
    setLook({ x: side === "H" ? -1 : 1, y: 0.7 });
    dispatch({ type: "flip", side });
  }, []);
  const onUndo = useCallback(() => dispatch({ type: "undo" }), []);
  const onClear = useCallback(() => dispatch({ type: "clear" }), []);
  const onDone = useCallback(() => dispatch({ type: "revealed" }), []);
  const closeSheet = useCallback(() => setSheet(false), []);

  const fresh = useCallback(() => {
    setCopy({ state: "idle", text: "" });
    setChart("switches");
    setLook({ x: 0, y: 0.6 });
  }, []);

  const apply = useCallback(
    (n: FlipCount, level: Level) => {
      if (n === s.n && level === s.level) return;
      setSettings({ n, level });
      fresh();
      dispatch({ type: "next", n, level, keep: false });
    },
    [s.n, s.level, fresh],
  );

  const next = useCallback(() => {
    fresh();
    dispatch({ type: "next", n: cfg.n, level: cfg.level, keep: cfg.n === s.n && cfg.level === s.level });
  }, [cfg.n, cfg.level, s.n, s.level, fresh]);

  const playReal = useCallback(() => {
    if (s.analysis) dispatch({ type: "real", run: realCoin(s.analysis) });
  }, [s.analysis]);

  const share = useCallback(async () => {
    if (!s.analysis) return;
    const text = shareLine(s.analysis, s.analysis.you, `${window.location.origin}/lab/coin`, s.streak);
    const ok = await copyText(text);
    setCopy({ state: ok ? "ok" : "fail", text });
  }, [s.analysis, s.streak]);

  let mood: CrunchyMood = "smirk";
  if (typing) {
    if (trailingRun(s.flips) >= 4) mood = "wow";
    else if (s.flips.length === s.n - 1) mood = "grin";
  } else if (s.phase === "crunching" || !j) {
    mood = "squint";
  } else if (j.tone === "close") {
    mood = "squint";
  } else if (j.caught && j.tone !== "long") {
    mood = "grin";
  } else {
    mood = "wow";
  }

  const w = a && j ? verdictWords(a, j) : null;
  let badge: ReactNode = null;
  let bubble: ReactNode;
  if (typing) {
    bubble = <p className="text-[15px] leading-snug text-ink">{hint(s.flips.length, s.n)}</p>;
  } else if (result && w && j) {
    bubble = (
      <div className="animate-rise">
        <h2 className={`display text-[26px] font-black leading-[1.05] ${j.caught ? "text-coral" : "text-mint"}`}>{w.head}</h2>
        <p className="mt-1.5 text-[15px] font-semibold leading-snug text-ink">{w.line}</p>
      </div>
    );
    badge = (
      <span
        className={`absolute -top-3 right-3 -rotate-6 rounded-lg border-2 bg-navy-900 px-2 py-0.5 text-[11px] font-black tracking-[0.14em] animate-pop [animation-delay:120ms] ${
          j.caught ? "border-coral text-coral" : "border-mint text-mint"
        }`}
      >
        {j.caught ? "FAKE" : "PASSED"}
      </span>
    );
  } else {
    bubble = (
      <div>
        <p className="display text-xl font-black text-gold">Let&apos;s crunch it.</p>
        <p className="mt-1 text-sm leading-snug text-mist">
          {fmt(COINS)} real coins, {s.n} flips each. First, your switches.
        </p>
      </div>
    );
  }

  const scanTarget = j ? (activeChart === "switches" ? j.sw.value : j.ru.value) : 0;
  const mark = result && j && activeChart === "run" ? { start: j.runStart, len: j.ru.value } : null;

  return (
    <>
      <div className={`h-full overflow-y-auto overscroll-contain no-scrollbar transition-[padding] duration-300 ${sheet ? "lg:pr-[396px]" : ""}`}>
        <div className="mx-auto flex min-h-full w-full max-w-xl flex-col gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex h-12 shrink-0 items-center justify-between gap-2">
            <div className="min-w-0 text-sm">
              {unlocked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-800/80 px-3 py-1.5 font-semibold text-mist ring-1 ring-edge/20">
                  Streak <b className="num text-ink">{s.streak}</b>
                  <span className="text-edge">·</span>
                  Best <b className="num text-ink">{Math.max(best, s.streak)}</b>
                </span>
              ) : (
                <span className="rounded-full bg-gold/10 px-3 py-1.5 font-semibold text-gold ring-1 ring-gold/25">Free round</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSheet(true)}
              aria-label="Detector settings"
              className="flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-mist ring-1 ring-edge/25 transition hover:text-ink active:scale-95"
            >
              <TuneIcon />
              <span className="num">{s.n} flips</span>
              <span className="text-edge max-[359px]:hidden">·</span>
              <span className="max-[359px]:hidden">{levelInfo(s.level).label}</span>
            </button>
          </div>

          <Host mood={mood} look={look} wiggle={s.phase === "crunching"} badge={badge} className={typing ? "[@media(max-height:479px)]:hidden" : ""}>
            {bubble}
          </Host>

          <Panel
            key={`flips-${s.id}`}
            title="Your flips"
            right={
              typing ? (
                <span className="num text-ink">
                  {s.flips.length} <span className="text-mist">/ {s.n}</span>
                </span>
              ) : j ? (
                <span className="flex items-baseline gap-1.5">
                  {activeChart === "switches" ? "Switches" : "Longest streak"}
                  <b className="display num text-base font-black text-ink">
                    <Counter to={scanTarget} live={s.phase === "crunching"} ms={SCAN_MS} />
                  </b>
                </span>
              ) : null
            }
          >
            <FlipGrid
              svgRef={gridEl}
              seq={s.flips}
              n={s.n}
              label={`Your ${s.n} flips`}
              ticks={!typing && !!j}
              scanMs={s.phase === "crunching" ? SCAN_MS : 0}
              mark={mark}
              landDelay={230}
            />
          </Panel>

          {typing ? (
            <div className="sticky bottom-0 -mx-4 mt-auto px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2"
                style={{ background: "linear-gradient(to top, #0b1020 72%, rgb(11 16 32 / 0))" }}
              />
              <div className="relative">
                <CoinPad paused={sheet} canUndo={s.flips.length > 0} onFlip={onFlip} onUndo={onUndo} onClear={onClear} />
              </div>
            </div>
          ) : a && w ? (
            <ChartCard
              key={`chart-${s.id}`}
              a={a}
              words={w}
              live={s.phase === "crunching"}
              ready={result}
              chart={activeChart}
              onChart={setChart}
              real={s.real}
              onDone={onDone}
            />
          ) : (
            <section className="glass rounded-3xl p-3">
              <ChartSkeleton />
            </section>
          )}

          {result && a && j && (
            <>
              {s.real && <RealPanel a={a} r={s.real} />}
              {unlocked && (s.streak >= 2 || s.ended > 0) && (
                <p className="animate-rise text-center text-sm font-bold text-gold">
                  {s.streak >= 2 ? `${s.streak} in a row. Keep it going!` : `Your streak ended at ${s.ended}. A new one starts now.`}
                </p>
              )}
              {!unlocked && !j.caught && (
                <p className="animate-rise text-balance text-center text-sm leading-snug text-mist">Twenty flips is short, so fakes can hide. The video used 100.</p>
              )}
              <Actions hasReal={!!s.real} copy={copy} onNext={next} onReal={playReal} onShare={share} />
              <p className="text-balance px-1 text-center text-xs leading-snug text-mist">
                From the video: the hand-typed row switched 77 times in 99. Of 10,000 simulated real coins (100 flips each), the most was 67.
              </p>
            </>
          )}
        </div>
      </div>

      <Sheet open={sheet} onClose={closeSheet} title="Detector settings">
        <SettingsPanel n={s.n} level={s.level} open={sheet} onPick={apply} />
      </Sheet>
    </>
  );
}
