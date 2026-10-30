"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COINS, domainFor, fmt, percentile } from "./engine";
import type { Dist, Tell } from "./engine";
import { BEAT_MS, RAMP_DELAY, RAMP_MS, rampShown, reducedMotion } from "./fx";
import { RampCount } from "./Parts";

const W = 340;
const H = 198;
const PAD = 8;
const TOP = 60;
const BASE = 170;
const PLOT = BASE - TOP;
const GOLD = "#FFC94A";
const CYAN = "#3FE0FF";

function tickStep(bins: number): number {
  const raw = bins / 7;
  for (const s of [1, 2, 5, 10, 20, 25, 50]) if (s >= raw) return s;
  return 100;
}

function Marker({ x, y, text, color, delay }: { x: number; y: number; text: string; color: string; delay: number }) {
  const w = 18 + text.length * 6.6;
  const cx = Math.min(Math.max(x, PAD + w / 2), W - PAD - w / 2);
  const tip = Math.min(Math.max(x - cx, -w / 2 + 12), w / 2 - 12);
  const anim = { transformBox: "fill-box", transformOrigin: "50% 100%", animationDelay: `${delay}ms` } as const;
  return (
    <g>
      <line x1={x} x2={x} y1={y + 17} y2={BASE} stroke={color} strokeWidth={1.6} strokeDasharray="3.5 3" className="animate-pop" style={anim} />
      <g transform={`translate(${cx} ${y})`}>
        <g className="animate-pop" style={anim}>
          <path d={`M ${tip - 5} 10 L ${tip} 17 L ${tip + 5} 10 Z`} fill={color} />
          <rect x={-w / 2} y={-11} width={w} height={22} rx={11} fill={color} />
          <text textAnchor="middle" dominantBaseline="central" y={0.5} fontSize={12} fontWeight={800} fill="#0B1020">
            {text}
          </text>
        </g>
      </g>
    </g>
  );
}

type Props = {
  dist: Dist;
  you: Tell;
  real: Tell | null;
  live: boolean;
  title: string;
  onDone: () => void;
};

export default function HistChart({ dist, you, real, live, title, onDone }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const youV = you.value;
  const realV = real ? real.value : null;
  const { lo, hi } = useMemo(() => domainFor(dist, realV === null ? [youV] : [youV, realV]), [dist, youV, realV]);
  const bins = hi - lo + 1;
  const bw = (W - PAD * 2) / bins;
  const gap = Math.min(1.6, bw * 0.22);
  const bar = Math.max(bw - gap, 0.8);
  const max = useMemo(() => {
    let m = 1;
    for (let v = lo; v <= hi; v++) if (dist.counts[v] > m) m = dist.counts[v];
    return m;
  }, [dist, lo, hi]);

  const rects = useRef<(SVGRectElement | null)[]>([]);
  const skip = useRef(false);
  const doneRef = useRef(onDone);
  const [ramped, setRamped] = useState(false);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!live) return;
    skip.current = false;
    const nodes = rects.current;
    const cum = new Uint32Array(bins);
    const values = dist.values;
    const fast = reducedMotion();
    const start = performance.now();
    let added = 0;
    let raf = 0;
    let beat = 0;
    const paint = () => {
      for (let b = 0; b < bins; b++) {
        const el = nodes[b];
        if (!el) continue;
        const h = (cum[b] / max) * PLOT;
        el.setAttribute("y", String(BASE - h));
        el.setAttribute("height", String(h));
      }
    };
    const frame = (now: number) => {
      const t = fast || skip.current ? RAMP_DELAY + RAMP_MS : now - start;
      const shown = rampShown(t);
      while (added < shown) {
        const b = values[added] - lo;
        if (b >= 0 && b < bins) cum[b]++;
        added++;
      }
      paint();
      if (shown < COINS) {
        raf = requestAnimationFrame(frame);
        return;
      }
      setRamped(true);
      beat = window.setTimeout(() => doneRef.current(), fast ? 0 : skip.current ? 140 : BEAT_MS);
    };
    paint();
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(beat);
    };
  }, [live, dist, lo, bins, max]);

  const marks = !live || ramped;
  const xc = (v: number) => PAD + (Math.min(Math.max(v, lo), hi) - lo + 0.5) * bw;
  const barH = (c: number) => (c / max) * PLOT;
  const off = (v: number) => (v < lo ? -1 : v > hi ? 1 : 0);
  const arrow = (v: number) => (off(v) > 0 ? " →" : off(v) < 0 ? " ←" : "");
  const step = tickStep(bins);
  const labels: number[] = [];
  for (let v = lo; v <= hi; v++) if (v % step === 0) labels.push(v);
  const youBin = youV >= lo && youV <= hi;
  const youH = Math.max(barH(dist.counts[Math.min(Math.max(youV, lo), hi)]), 3);
  const desc = `${title}. Histogram of ${fmt(COINS)} real coins. You: ${youV}, ${percentile(you.pct)} percentile${real ? `. Real coin: ${real.value}` : ""}.`;

  return (
    <div
      onClick={() => {
        if (live) skip.current = true;
      }}
      className={live ? "cursor-pointer" : undefined}
    >
      <div className="mb-1 flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">
            <RampCount live={live} /> real coins
          </p>
          <p className="truncate text-[13px] font-semibold text-ink">{title}</p>
        </div>
        <ul className="flex shrink-0 gap-3 pb-0.5 text-[11px] text-mist">
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-mint" />
            passes
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-coral" />
            flagged
          </li>
        </ul>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={desc}>
        <defs>
          <linearGradient id={`${uid}-ok`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6CF2C0" />
            <stop offset="1" stopColor="#25B982" />
          </linearGradient>
          <linearGradient id={`${uid}-bad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FF8CA1" />
            <stop offset="1" stopColor="#D13A5A" />
          </linearGradient>
        </defs>

        {Array.from({ length: bins }, (_, b) => {
          const v = lo + b;
          const h = live ? 0 : barH(dist.counts[v]);
          return (
            <rect
              key={v}
              ref={(el) => {
                rects.current[b] = el;
              }}
              x={PAD + b * bw + gap / 2}
              y={BASE - h}
              width={bar}
              height={h}
              rx={Math.min(2, bw / 3)}
              fill={`url(#${uid}-${dist.flagged[v] ? "bad" : "ok"})`}
            />
          );
        })}

        <line x1={PAD} x2={W - PAD} y1={BASE} y2={BASE} stroke="#3A4C80" strokeWidth={1.5} />
        {labels.map((v) => (
          <g key={v}>
            <line x1={xc(v)} x2={xc(v)} y1={BASE} y2={BASE + 4} stroke="#3A4C80" strokeWidth={1.5} />
            <text x={xc(v)} y={BASE + 17} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="#A9B6D3" fillOpacity={0.85}>
              {v}
            </text>
          </g>
        ))}

        {marks && youBin && (
          <rect
            x={PAD + (youV - lo) * bw + gap / 2 - 1}
            y={BASE - youH - 1}
            width={bar + 2}
            height={youH + 1}
            rx={2.5}
            fill="none"
            stroke={GOLD}
            strokeWidth={1.6}
            className="animate-pop"
            style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
          />
        )}
        {marks && real && <Marker x={xc(real.value)} y={38} text={`Real · ${real.value}${arrow(real.value)}`} color={CYAN} delay={120} />}
        {marks && <Marker x={xc(youV)} y={15} text={`You · ${youV}${arrow(youV)}`} color={GOLD} delay={0} />}
      </svg>
    </div>
  );
}
