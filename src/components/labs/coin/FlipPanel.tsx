"use client";

import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import FlipGrid, { rowsFor } from "./FlipGrid";
import { reducedMotion } from "./fx";
import { EXTRA, SEMI, V, VPill, toneColor, u, type Tone } from "./scene";

export type Mode = "typing" | "wait" | "scan" | "done";

function useHead(len: number, active: boolean, ms: number): number {
  const [head, setHead] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (ms <= 0 || reducedMotion()) {
      const id = window.setTimeout(() => setHead(len), 0);
      return () => window.clearTimeout(id);
    }
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setHead(Math.min(len, Math.floor(p * (len + 1))));
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, len, ms]);
  return active ? head : len;
}

function switchesUpTo(seq: string, head: number): number {
  let c = 0;
  for (let i = 1; i <= Math.min(head, seq.length - 1); i++) if (seq[i] !== seq[i - 1]) c++;
  return c;
}

function Stamp({ word, rows, delay }: { word: "REAL" | "FAKE"; rows: number; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const k = rows >= 3 ? 1 : rows === 2 ? 0.85 : 0.7;
  const color = word === "REAL" ? V.mint : V.coral;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || typeof el.animate !== "function") {
      el.style.opacity = "1";
      return;
    }
    const base = `translate(-50%, -50%) rotate(-8deg)`;
    const a = el.animate(
      [
        { transform: `${base} scale(${k * 1.6})`, opacity: 0 },
        { transform: `${base} scale(${k})`, opacity: 1 },
      ],
      { duration: 360, delay, easing: "cubic-bezier(0.2, 1.25, 0.4, 1)", fill: "both" },
    );
    return () => a.cancel();
  }, [k, delay, word]);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 flex items-center justify-center"
      style={{
        ...EXTRA,
        opacity: 0,
        transform: `translate(-50%, -50%) rotate(-8deg) scale(${k})`,
        height: u(108),
        padding: `0 ${u(30)}`,
        fontSize: u(74),
        lineHeight: 1,
        color,
        borderRadius: u(18),
        border: `${u(7)} solid ${color}`,
        background: "rgb(7 11 23 / 0.55)",
        zIndex: 2,
      }}
    >
      {word}
    </div>
  );
}

function Counter({ label, color, children }: { label: string; color: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline">
      <span style={{ ...SEMI, fontSize: u(26), color: V.muted }}>{label}</span>
      <span
        className="num"
        style={{ ...EXTRA, fontSize: u(52), color, width: u(150), textAlign: "right", textShadow: `0 ${u(2.6)} ${u(5)} rgb(0 0 0 / 0.5)`, transition: "color .3s" }}
      >
        {children}
      </span>
    </div>
  );
}

type Props = {
  label: string;
  seq: string;
  n: number;
  mode: Mode;
  tone: Tone;
  metric: "switches" | "run";
  value: number;
  stamp: "REAL" | "FAKE" | null;
  stampDelay?: number;
  scanMs?: number;
  stagger?: number;
  landDelay?: number;
  mark?: { start: number; len: number } | null;
  svgRef?: Ref<SVGSVGElement>;
};

export default function FlipPanel({ label, seq, n, mode, tone, metric, value, stamp, stampDelay = 0, scanMs = 0, stagger = 0, landDelay = 0, mark = null, svgRef }: Props) {
  const len = seq.length;
  const head = useHead(len, mode === "scan", scanMs);
  const scanning = mode === "scan" && head < len;
  const showTicks = mode === "scan" || mode === "done";
  const rim = toneColor(scanning ? "idle" : tone);
  const name = metric === "switches" ? "SWITCHES" : "LONGEST STREAK";

  let counter: ReactNode = null;
  if (mode === "typing") {
    counter = (
      <Counter label="FLIPS" color={V.white}>
        {len}
        <span style={{ ...SEMI, fontSize: u(32), color: V.muted }}> / {n}</span>
      </Counter>
    );
  } else if (mode === "scan") {
    counter = (
      <Counter label={name} color={scanning ? V.white : rim}>
        {metric === "switches" ? (scanning ? switchesUpTo(seq, head) : value) : value}
      </Counter>
    );
  } else if (mode === "done") {
    counter = (
      <Counter label={name} color={rim}>
        {value}
      </Counter>
    );
  }

  return (
    <div style={{ width: u(876), marginLeft: "auto", marginRight: "auto" }}>
      <div className="flex items-center justify-between" style={{ height: u(50), marginBottom: u(9), padding: `0 ${u(14)} 0 ${u(15)}` }}>
        <VPill color={rim} size={32}>
          {label}
        </VPill>
        {counter}
      </div>
      <div
        className="relative"
        style={{
          borderRadius: u(22),
          background: "rgb(12 20 48 / 0.94)",
          border: `${u(3)} solid ${rim}B3`,
          boxShadow: `0 0 ${u(32)} rgb(0 0 0 / 0.4)`,
          padding: `${u(14.5)} ${u(15)}`,
          transition: "border-color .3s",
        }}
      >
        <FlipGrid
          svgRef={svgRef}
          seq={seq}
          n={n}
          label={`${label === "YOU" ? "Your" : "A real coin's"} ${n} flips`}
          ticks={showTicks}
          head={mode === "scan" ? head : undefined}
          glow={scanning}
          mark={mark}
          stagger={stagger}
          landDelay={landDelay}
        />
        {stamp ? <Stamp key={stamp} word={stamp} rows={rowsFor(n)} delay={stampDelay} /> : null}
      </div>
    </div>
  );
}
