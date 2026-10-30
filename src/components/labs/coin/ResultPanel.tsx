"use client";

import { Locked, LockIcon, useAccess } from "@/components/access/AccessProvider";
import { expectedSwitches, percentile } from "./engine";
import type { Analysis, Judged, Metric, Tell } from "./engine";
import { LESSON, realWords } from "./copy";
import type { Words } from "./copy";
import FlipGrid from "./FlipGrid";
import HistChart from "./HistChart";
import { CheckIcon, CopyIcon, CoinIcon, RepeatIcon } from "./Parts";

function Status({ flagged }: { flagged: boolean }) {
  return (
    <span
      role="img"
      aria-label={flagged ? "flagged" : "passes"}
      title={flagged ? "flagged" : "passes"}
      className={`grid size-[18px] shrink-0 place-items-center rounded-full ${flagged ? "bg-coral/20 text-coral" : "bg-mint/20 text-mint"}`}
    >
      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {flagged ? <path d="M7 7l10 10M17 7 7 17" /> : <path d="m5.5 12.5 4.5 4.5 8.5-9.5" />}
      </svg>
    </span>
  );
}

function TellCard({ label, t, avg, active, locked = false, onPick }: { label: string; t: Tell; avg: string; active: boolean; locked?: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onPick}
      className={`flex min-h-[104px] flex-col rounded-2xl p-3 text-left ring-1 transition active:scale-[0.98] ${
        active ? "bg-gold/[0.07] ring-gold/60" : "bg-navy-900/40 ring-edge/20"
      }`}
    >
      <span className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-mist">
        {label}
        {locked && <LockIcon className="h-3.5 w-3.5 text-gold" />}
      </span>
      <span className="mt-1.5 flex items-baseline gap-1.5">
        <span className="display num text-[30px] font-black leading-none text-ink">{t.value}</span>
        <span className="text-xs text-mist">real avg {avg}</span>
      </span>
      <span className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs">
        <span className="font-semibold text-ink">
          {percentile(t.pct)} <span className="font-medium text-mist">percentile</span>
        </span>
        <Status flagged={t.flagged} />
      </span>
    </button>
  );
}

type ChartCardProps = {
  a: Analysis;
  words: Words;
  live: boolean;
  ready: boolean;
  chart: Metric;
  onChart: (m: Metric) => void;
  real: Judged | null;
  onDone: () => void;
};

export function ChartCard({ a, words, live, ready, chart, onChart, real, onDone }: ChartCardProps) {
  const { unlocked, upsell } = useAccess();
  const j = a.you;
  const active: Metric = unlocked ? chart : "switches";
  const dist = active === "switches" ? a.sw : a.ru;
  const you = active === "switches" ? j.sw : j.ru;
  const realTell = real ? (active === "switches" ? real.sw : real.ru) : null;
  const title = active === "switches" ? `Switches in ${a.n} flips` : `Longest streak in ${a.n} flips`;

  return (
    <section className="glass rounded-3xl p-3">
      <HistChart key={active} dist={dist} you={you} real={realTell} live={live} title={title} onDone={onDone} />
      {ready && (
        <>
          <div role="tablist" aria-label="Chart" className="mt-3 grid animate-rise grid-cols-2 gap-2">
            <TellCard label="Switches" t={j.sw} avg={expectedSwitches(a.n).toFixed(1)} active={active === "switches"} onPick={() => onChart("switches")} />
            <TellCard
              label="Longest streak"
              t={j.ru}
              avg={a.runAvg.toFixed(1)}
              active={active === "run"}
              locked={!unlocked}
              onPick={() => (unlocked ? onChart("run") : upsell("The longest-run chart"))}
            />
          </div>
          <div className="mt-3 animate-rise space-y-1.5 border-t border-edge/15 pt-3 text-[13px] leading-snug [animation-delay:90ms]">
            <p className="text-ink/90">{words.facts}</p>
            <p className="text-mist">{LESSON}</p>
          </div>
        </>
      )}
    </section>
  );
}

export function RealPanel({ a, r }: { a: Analysis; r: Judged }) {
  const w = realWords(a, r);
  const stagger = Math.min(40, 700 / a.n);
  return (
    <section className="animate-rise rounded-3xl bg-navy-850/70 px-3.5 pb-3 pt-2.5 ring-1 ring-cyan/30">
      <header className="mb-2 flex h-6 items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan">
        <span>A real coin</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-black normal-case tracking-normal text-navy-950 ${r.caught ? "bg-coral" : "bg-mint"}`}>{w.head}</span>
      </header>
      <FlipGrid key={r.seq} seq={r.seq} n={a.n} label="Flips from a real coin" ticks stagger={stagger} scanMs={stagger * a.n} />
      <p className="mt-2 text-[13px] leading-snug text-mist">{w.line}</p>
    </section>
  );
}

const primary =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-[15px] font-black text-navy-950 shadow-[0_5px_0_#8f6414] transition active:translate-y-[3px] active:shadow-[0_2px_0_#8f6414]";
const ghost = "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-800/80 px-4 text-[15px] font-bold text-ink ring-1 ring-edge/40 transition active:scale-[0.98]";

type ActionsProps = {
  hasReal: boolean;
  copy: { state: "idle" | "ok" | "fail"; text: string };
  onNext: () => void;
  onReal: () => void;
  onShare: () => void;
};

export function Actions({ hasReal, copy, onNext, onReal, onShare }: ActionsProps) {
  const { unlocked } = useAccess();
  return (
    <div className="grid animate-rise gap-2.5 [animation-delay:160ms]">
      <Locked label="Endless rounds">
        <button type="button" onClick={onNext} className={primary}>
          <RepeatIcon />
          {unlocked ? "Next round" : "Another round"}
        </button>
      </Locked>
      <Locked label="Let a real coin play">
        <button type="button" onClick={onReal} className={ghost}>
          <CoinIcon />
          {hasReal ? "Flip another real coin" : "Let a real coin play"}
        </button>
      </Locked>
      <Locked label="Copying a share line">
        <button type="button" onClick={onShare} className={ghost}>
          {copy.state === "ok" ? <CheckIcon className="h-4 w-4 text-mint" /> : <CopyIcon />}
          {copy.state === "ok" ? "Copied!" : "Copy share line"}
        </button>
      </Locked>
      {copy.state === "fail" && (
        <label className="block text-xs text-mist">
          Copy this line yourself:
          <textarea
            readOnly
            value={copy.text}
            rows={3}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1 w-full resize-none rounded-xl bg-navy-900/70 p-2 text-[13px] text-ink ring-1 ring-edge/30"
          />
        </label>
      )}
    </div>
  );
}
