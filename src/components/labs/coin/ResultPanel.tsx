"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Locked, LockIcon, useAccess } from "@/components/access/AccessProvider";
import type { CrunchyMood } from "@/components/Crunchy";
import { expectedSwitches, percentile } from "./engine";
import type { Analysis, Judged, Metric, Tell } from "./engine";
import { LESSON, realWords } from "./copy";
import type { Words } from "./copy";
import FlipPanel from "./FlipPanel";
import HistChart from "./HistChart";
import { CheckIcon, CopyIcon, CoinIcon, RepeatIcon } from "./Parts";
import { EXTRA, Mascot, SEMI, V, u } from "./scene";

function Status({ flagged }: { flagged: boolean }) {
  return (
    <span
      role="img"
      aria-label={flagged ? "flagged" : "passes"}
      title={flagged ? "flagged" : "passes"}
      className="grid shrink-0 place-items-center rounded-full"
      style={{ width: u(52), height: u(52), background: `${flagged ? V.coral : V.mint}33`, color: flagged ? V.coral : V.mint }}
    >
      <svg viewBox="0 0 24 24" style={{ width: u(30), height: u(30) }} fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
      className="flex flex-col text-left transition active:scale-[0.98]"
      style={{
        minHeight: u(290),
        padding: u(30),
        borderRadius: u(22),
        background: active ? "rgb(255 201 74 / 0.07)" : "rgb(12 20 48 / 0.94)",
        border: `${u(3)} solid ${active ? "rgb(255 201 74 / 0.7)" : "rgb(169 182 211 / 0.3)"}`,
        boxShadow: `0 0 ${u(32)} rgb(0 0 0 / 0.4)`,
      }}
    >
      <span className="flex items-center justify-between gap-2" style={{ ...SEMI, fontSize: u(30), lineHeight: 1.2, color: V.muted }}>
        {label.toUpperCase()}
        {locked && <LockIcon className="h-3.5 w-3.5 text-gold" />}
      </span>
      <span className="flex items-baseline" style={{ gap: u(14), marginTop: u(14) }}>
        <span className="num" style={{ ...EXTRA, fontSize: u(92), lineHeight: 1, color: V.white }}>
          {t.value}
        </span>
        <span style={{ ...SEMI, fontSize: u(32), color: V.muted }}>real avg {avg}</span>
      </span>
      <span className="mt-auto flex items-center justify-between gap-2" style={{ paddingTop: u(22), fontSize: u(32) }}>
        <span style={{ ...EXTRA, color: V.white }}>
          {percentile(t.pct)} <span style={{ ...SEMI, color: V.muted }}>percentile</span>
        </span>
        <Status flagged={t.flagged} />
      </span>
    </button>
  );
}

type ChartCardProps = {
  a: Analysis;
  words: Words;
  mood: CrunchyMood;
  live: boolean;
  ready: boolean;
  chart: Metric;
  onChart: (m: Metric) => void;
  real: Judged | null;
  onDone: () => void;
};

function Wow({ mood }: { mood: CrunchyMood }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setOn(false), 1900);
    return () => window.clearTimeout(id);
  }, []);
  if (!on) return null;
  return (
    <div className="pointer-events-none absolute z-10 animate-pop" style={{ left: u(8), top: u(70) }}>
      <Mascot width={150} mood={mood} look={{ x: 0.6, y: -0.5 }} />
    </div>
  );
}

export function ChartCard({ a, words, mood, live, ready, chart, onChart, real, onDone }: ChartCardProps) {
  const { unlocked, upsell } = useAccess();
  const j = a.you;
  const active: Metric = unlocked ? chart : "switches";
  const dist = active === "switches" ? a.sw : a.ru;
  const you = active === "switches" ? j.sw : j.ru;
  const realTell = real ? (active === "switches" ? real.sw : real.ru) : null;
  const title = active === "switches" ? `Switches in ${a.n} flips` : `Longest streak in ${a.n} flips`;

  return (
    <section className="relative">
      <HistChart
        key={active}
        dist={dist}
        n={a.n}
        you={you}
        youTone={j.caught ? "bad" : "ok"}
        real={realTell}
        realTone={real && real.caught ? "bad" : "ok"}
        live={live}
        title={title}
        onDone={onDone}
      />
      {ready && <Wow mood={mood} />}
      {ready && (
        <>
          <div role="tablist" aria-label="Chart" className="grid animate-rise grid-cols-2" style={{ width: u(876), marginLeft: "auto", marginRight: "auto", marginTop: u(44), gap: u(24) }}>
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
          <div className="animate-rise [animation-delay:90ms]" style={{ width: u(876), marginLeft: "auto", marginRight: "auto", marginTop: u(36), padding: `0 ${u(8)}`, ...SEMI, fontSize: u(38), lineHeight: 1.36 }}>
            <p style={{ color: "rgb(244 246 251 / 0.92)" }}>{words.facts}</p>
            <p style={{ color: V.muted, marginTop: u(16), fontSize: u(36) }}>{LESSON}</p>
          </div>
        </>
      )}
    </section>
  );
}

export function RealPanel({ a, r }: { a: Analysis; r: Judged }) {
  const w = realWords(a, r);
  const stagger = Math.min(40, 700 / a.n);
  const scanMs = stagger * a.n;
  return (
    <section className="animate-rise" style={{ width: u(1080) }}>
      <FlipPanel
        key={r.seq}
        label="REAL"
        seq={r.seq}
        n={a.n}
        mode="scan"
        tone={r.caught ? "bad" : "ok"}
        metric="switches"
        value={r.sw.value}
        stamp={r.caught ? "FAKE" : "REAL"}
        stampDelay={scanMs + 150}
        scanMs={scanMs}
        stagger={stagger}
      />
      <p className="text-balance text-center" style={{ ...SEMI, fontSize: u(38), lineHeight: 1.36, color: V.muted, marginTop: u(26), padding: `0 ${u(70)}` }}>
        {w.line}
      </p>
    </section>
  );
}

function button(primary: boolean): CSSProperties {
  return {
    ...EXTRA,
    width: "100%",
    height: `max(48px, ${u(150)})`,
    fontSize: `max(15px, ${u(46)})`,
    borderRadius: 9999,
    background: primary ? V.gold : "rgb(12 20 48 / 0.94)",
    color: primary ? V.ink : V.white,
    border: primary ? "none" : `${u(3)} solid rgb(169 182 211 / 0.4)`,
    boxShadow: primary ? `0 0 ${u(44)} rgb(255 201 74 / 0.32)` : `0 0 ${u(32)} rgb(0 0 0 / 0.4)`,
  };
}

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
    <div className="grid animate-rise [animation-delay:160ms]" style={{ width: u(876), marginLeft: "auto", marginRight: "auto", gap: u(30) }}>
      <Locked label="Endless rounds">
        <button type="button" onClick={onNext} className="flex items-center justify-center gap-2 transition active:scale-[0.98]" style={button(true)}>
          <RepeatIcon />
          {unlocked ? "Next round" : "Another round"}
        </button>
      </Locked>
      <Locked label="Let a real coin play">
        <button type="button" onClick={onReal} className="flex items-center justify-center gap-2 transition active:scale-[0.98]" style={button(false)}>
          <CoinIcon />
          {hasReal ? "Flip another real coin" : "Let a real coin play"}
        </button>
      </Locked>
      <Locked label="Copying a share line">
        <button type="button" onClick={onShare} className="flex items-center justify-center gap-2 transition active:scale-[0.98]" style={button(false)}>
          {copy.state === "ok" ? <CheckIcon className="h-4 w-4 text-mint" /> : <CopyIcon />}
          {copy.state === "ok" ? "Copied!" : "Copy share line"}
        </button>
      </Locked>
      {copy.state === "fail" && (
        <label className="block" style={{ ...SEMI, fontSize: u(34), color: V.muted }}>
          Copy this line yourself:
          <textarea
            readOnly
            value={copy.text}
            rows={3}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1 w-full resize-none p-2"
            style={{ ...SEMI, fontSize: u(36), color: V.white, borderRadius: u(22), background: "rgb(12 20 48 / 0.94)", border: `${u(3)} solid rgb(169 182 211 / 0.4)` }}
          />
        </label>
      )}
    </div>
  );
}
