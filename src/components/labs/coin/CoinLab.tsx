"use client";

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { CrunchyMood } from "@/components/Crunchy";
import Sheet from "@/components/Sheet";
import { useAccess } from "@/components/access/AccessProvider";
import { COINS, FREE, analyzeAsync, fmt, levelInfo, realCoin, trailingRun } from "./engine";
import type { FlipCount, Level, Metric, Side } from "./engine";
import { hintCaption, shareLine, words as verdictWords } from "./copy";
import { Caption } from "./Caption";
import CoinPad from "./CoinPad";
import { cellRect } from "./FlipGrid";
import FlipPanel from "./FlipPanel";
import { SCAN_MS, copyText, toss } from "./fx";
import { Actions, ChartCard, RealPanel } from "./ResultPanel";
import SettingsPanel from "./SettingsPanel";
import { ChartSkeleton, TuneIcon } from "./Parts";
import { Mascot, QMark, SEMI, SceneBg, UNIT, V, u } from "./scene";
import { initial, reducer } from "./state";
import { useBest } from "./useBest";

type Copy = { state: "idle" | "ok" | "fail"; text: string };

const chip = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1";

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
  const crunching = s.phase === "crunching";
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
  } else if (crunching || !j) {
    mood = "squint";
  } else if (j.tone === "close") {
    mood = "squint";
  } else if (j.caught && j.tone !== "long") {
    mood = "grin";
  } else {
    mood = "wow";
  }

  const w = a && j ? verdictWords(a, j) : null;
  const hc = hintCaption(s.flips.length, s.n);
  const caption = typing
    ? { key: `${s.id}-${hc.key}`, markup: hc.cap, sub: hc.sub }
    : result && w
      ? { key: `${s.id}-verdict`, markup: w.cap, sub: w.line }
      : { key: `${s.id}-crunch`, markup: "Let's [g]crunch[/] it.", sub: `${fmt(COINS)} real coins, ${s.n} flips each. First, your switches.` };

  const mark = result && j && activeChart === "run" ? { start: j.runStart, len: j.ru.value } : null;
  const panelMode = typing ? "typing" : crunching ? (a ? "scan" : "wait") : "done";
  const panelValue = j ? (activeChart === "switches" ? j.sw.value : j.ru.value) : 0;

  return (
    <>
      <div className="relative h-full" style={{ containerType: "inline-size" }}>
        <div className="relative h-full" style={UNIT}>
          <SceneBg />
          <div className={`relative h-full overflow-y-auto overscroll-contain no-scrollbar transition-[padding] duration-300 ${sheet ? "lg:pr-[396px]" : ""}`}>
            <div className="mx-auto flex min-h-full flex-col" style={{ width: u(1080), rowGap: u(52), paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              <div className="flex h-12 shrink-0 items-center justify-between gap-2" style={{ padding: `0 ${u(40)}` }}>
                <div className="min-w-0 text-sm" style={SEMI}>
                  {unlocked ? (
                    <span className={chip} style={{ color: V.muted, background: "rgb(12 20 48 / 0.9)", ["--tw-ring-color" as string]: "rgb(169 182 211 / 0.3)" }}>
                      Streak <b className="num" style={{ color: V.white }}>{s.streak}</b>
                      <span style={{ color: V.axis }}>·</span>
                      Best <b className="num" style={{ color: V.white }}>{Math.max(best, s.streak)}</b>
                    </span>
                  ) : (
                    <span className={chip} style={{ color: V.gold, background: "rgb(255 201 74 / 0.1)", ["--tw-ring-color" as string]: "rgb(255 201 74 / 0.28)" }}>
                      Free round
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSheet(true)}
                  aria-label="Detector settings"
                  className="flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm ring-1 transition hover:brightness-125 active:scale-95"
                  style={{ ...SEMI, color: V.muted, background: "rgb(12 20 48 / 0.9)", ["--tw-ring-color" as string]: "rgb(169 182 211 / 0.3)" }}
                >
                  <TuneIcon />
                  <span className="num">{s.n} flips</span>
                  <span className="max-[359px]:hidden" style={{ color: V.axis }}>·</span>
                  <span className="max-[359px]:hidden">{levelInfo(s.level).label}</span>
                </button>
              </div>

              <div className="relative" style={{ paddingBottom: u(8) }}>
                <Caption key={caption.key} markup={caption.markup} sub={caption.sub} />
              </div>

              {typing ? (
                <>
                  <div className="my-auto flex flex-col items-center" style={{ rowGap: u(64) }}>
                    <FlipPanel
                      key={`flips-${s.id}`}
                      label="YOU"
                      seq={s.flips}
                      n={s.n}
                      mode="typing"
                      tone="idle"
                      metric="switches"
                      value={0}
                      stamp={null}
                      svgRef={gridEl}
                      landDelay={230}
                    />
                    <Mascot width={175} mood={mood} look={look} />
                  </div>
                  <div className="sticky bottom-0 mt-0 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2"
                      style={{ background: "linear-gradient(to top, rgb(12 18 38 / 0.96) 70%, rgb(12 18 38 / 0))" }}
                    />
                    <div className="relative">
                      <CoinPad paused={sheet} canUndo={s.flips.length > 0} onFlip={onFlip} onUndo={onUndo} onClear={onClear} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <FlipPanel
                    key={`flips-${s.id}`}
                    label="YOU"
                    seq={s.flips}
                    n={s.n}
                    mode={panelMode}
                    tone={result && j ? (j.caught ? "bad" : "ok") : "idle"}
                    metric={activeChart}
                    value={panelValue}
                    stamp={result && j ? (j.caught ? "FAKE" : "REAL") : null}
                    scanMs={SCAN_MS}
                    mark={mark}
                    svgRef={gridEl}
                  />
                  <div className="relative">
                    {a && w ? (
                      <ChartCard
                        key={`chart-${s.id}`}
                        a={a}
                        words={w}
                        mood={mood}
                        live={crunching}
                        ready={result}
                        chart={activeChart}
                        onChart={setChart}
                        real={s.real}
                        onDone={onDone}
                      />
                    ) : (
                      <ChartSkeleton />
                    )}
                    {crunching && (
                      <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10" style={{ top: u(190) }}>
                        <div className="absolute animate-pop" style={{ left: u(130) }}>
                          <Mascot width={230} mood="squint" look={{ x: 0.8, y: -0.1 }} />
                        </div>
                        <div className="absolute animate-pop" style={{ left: u(690), top: u(10), animationDelay: "120ms" }}>
                          <QMark height={310} />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {result && a && j && (
                <>
                  {s.real && <RealPanel a={a} r={s.real} />}
                  {unlocked && (s.streak >= 2 || s.ended > 0) && (
                    <p className="animate-rise text-center" style={{ fontWeight: 800, fontSize: u(42), color: V.gold }}>
                      {s.streak >= 2 ? `${s.streak} in a row. Keep it going!` : `Your streak ended at ${s.ended}. A new one starts now.`}
                    </p>
                  )}
                  {!unlocked && !j.caught && (
                    <p className="animate-rise text-balance text-center" style={{ ...SEMI, fontSize: u(40), lineHeight: 1.3, color: V.muted, padding: `0 ${u(90)}` }}>
                      Twenty flips is short, so fakes can hide. The video used 100.
                    </p>
                  )}
                  <Actions hasReal={!!s.real} copy={copy} onNext={next} onReal={playReal} onShare={share} />
                  <p className="text-balance text-center" style={{ ...SEMI, fontSize: u(34), lineHeight: 1.35, color: V.muted, padding: `0 ${u(100)}` }}>
                    From the video: the hand-typed row switched 77 times in 99. Of 10,000 simulated real coins (100 flips each), the most was 67.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={sheet} onClose={closeSheet} title="Detector settings">
        <SettingsPanel n={s.n} level={s.level} open={sheet} onPick={apply} />
      </Sheet>
    </>
  );
}
