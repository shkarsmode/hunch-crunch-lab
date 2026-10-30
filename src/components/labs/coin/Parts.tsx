"use client";

import { useEffect, useState, type ReactNode } from "react";
import Crunchy, { type CrunchyMood } from "@/components/Crunchy";
import { COINS, fmt } from "./engine";
import { rampShown, reducedMotion } from "./fx";

export function Host({
  mood,
  look,
  wiggle = false,
  badge,
  className = "",
  children,
}: {
  mood: CrunchyMood;
  look: { x: number; y: number };
  wiggle?: boolean;
  badge?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex items-end gap-2.5 ${className}`}>
      <div className={`shrink-0 ${wiggle ? "animate-wiggle" : ""}`}>
        <Crunchy size={76} mood={mood} look={look} />
      </div>
      <div className="glass relative flex min-h-[88px] min-w-0 flex-1 flex-col justify-center rounded-3xl rounded-bl-lg px-4 py-3" aria-live="polite">
        {badge}
        {children}
      </div>
    </div>
  );
}

export function Panel({ title, right, children, className = "" }: { title: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl bg-navy-850/70 px-3.5 pb-3 pt-2.5 ring-1 ring-edge/20 ${className}`}>
      <header className="mb-2 flex h-6 items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">
        <span>{title}</span>
        {right}
      </header>
      {children}
    </section>
  );
}

export function Counter({ to, live, ms }: { to: number; live: boolean; ms: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!live) return;
    if (reducedMotion()) {
      const id = window.setTimeout(() => setShown(to), 0);
      return () => window.clearTimeout(id);
    }
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const u = Math.min(1, (now - t0) / ms);
      setShown(Math.round(to * u));
      if (u < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [live, to, ms]);
  return <span className="num">{live ? shown : to}</span>;
}

export function RampCount({ live }: { live: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!live) return;
    if (reducedMotion()) {
      const id = window.setTimeout(() => setShown(COINS), 0);
      return () => window.clearTimeout(id);
    }
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const s = rampShown(now - t0);
      setShown(s);
      if (s < COINS) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [live]);
  return <span className="num">{fmt(live ? shown : COINS)}</span>;
}

export function ChartSkeleton() {
  const heights = Array.from({ length: 20 }, (_, i) => Math.exp(-Math.pow((i - 9.5) / 3.3, 2) / 2));
  const bw = 324 / 20;
  return (
    <div aria-hidden>
      <div className="mb-1 flex items-end justify-between gap-3 px-1">
        <div className="space-y-1.5">
          <div className="h-3 w-28 animate-pulse rounded-full bg-edge/20" />
          <div className="h-3.5 w-36 animate-pulse rounded-full bg-edge/15" />
        </div>
        <div className="h-3 w-24 animate-pulse rounded-full bg-edge/15" />
      </div>
      <svg viewBox="0 0 340 198" className="block h-auto w-full">
        <g className="animate-pulse">
          {heights.map((h, i) => (
            <rect key={i} x={8 + i * bw + 1} y={170 - h * 108} width={bw - 2} height={h * 108} rx={2} fill="#6F80B3" fillOpacity={0.16} />
          ))}
        </g>
        <line x1={8} x2={332} y1={170} y2={170} stroke="#3A4C80" strokeWidth={1.5} />
      </svg>
    </div>
  );
}

type IconProps = { className?: string };

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export function TuneIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h8M18 7h2M4 17h2M12 17h8" />
      <circle cx="15" cy="7" r="2.4" />
      <circle cx="9" cy="17" r="2.4" />
    </svg>
  );
}

export function UndoIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h9a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

export function ResetIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export function CheckIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CopyIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="9" y="9" width="11" height="11" rx="3" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

export function CoinIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.5 10c0-1.1 1.1-1.8 2.5-1.8s2.5.7 2.5 1.8-1.1 1.6-2.5 1.8-2.5.7-2.5 1.8 1.1 1.8 2.5 1.8 2.5-.7 2.5-1.8" strokeWidth="1.6" />
    </svg>
  );
}

export function RepeatIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M17 3l4 4-4 4" />
      <path d="M3 11V9a2 2 0 0 1 2-2h16" />
      <path d="M7 21l-4-4 4-4" />
      <path d="M21 13v2a2 2 0 0 1-2 2H3" />
    </svg>
  );
}
