"use client";

import { Fragment, memo, useId, type Ref } from "react";
import { V } from "./scene";

export const COLS = 20;
const CELL = 42;
const R = 17;
const POP = { transformBox: "fill-box", transformOrigin: "center" } as const;
const LETTER = { fontVariationSettings: '"opsz" 32' } as const;

export function rowsFor(n: number): number {
  return Math.ceil(n / COLS);
}

export function cellRect(svg: SVGSVGElement, i: number, n: number): DOMRect {
  const r = svg.getBoundingClientRect();
  const cw = r.width / COLS;
  const ch = r.height / rowsFor(n);
  const d = cw * (R * 2) / CELL;
  const cx = r.left + (i % COLS) * cw + cw / 2;
  const cy = r.top + Math.floor(i / COLS) * ch + ch / 2;
  return new DOMRect(cx - d / 2, cy - d / 2, d, d);
}

function segments(start: number, len: number) {
  const out: { row: number; c0: number; c1: number }[] = [];
  const end = start + len;
  let i = start;
  while (i < end) {
    const row = Math.floor(i / COLS);
    const rowEnd = Math.min(end, (row + 1) * COLS);
    out.push({ row, c0: i % COLS, c1: (rowEnd - 1) % COLS });
    i = rowEnd;
  }
  return out;
}

const cx = (i: number) => (i % COLS) * CELL + CELL / 2;
const cy = (i: number) => Math.floor(i / COLS) * CELL + CELL / 2;

const Coin = memo(function Coin({ uid, side, i, delay }: { uid: string; side: string; i: number; delay: number }) {
  return (
    <g transform={`translate(${cx(i)} ${cy(i)})`}>
      <g className="animate-pop" style={{ ...POP, animationDelay: `${delay}ms` }}>
        <circle cy={R * 0.14} r={R + 3.4} fill={`url(#${uid}-sh)`} />
        <circle r={R} fill={side === "H" ? V.gold : V.cyan} />
        <circle r={R * 0.8} fill="none" stroke={V.ink} strokeOpacity={0.18} strokeWidth={2} />
        <text y={R * 0.42} textAnchor="middle" fontSize={R * 1.15} fontWeight={800} fill={V.ink} style={LETTER}>
          {side}
        </text>
      </g>
    </g>
  );
});

const Slot = memo(function Slot({ i, next }: { i: number; next: boolean }) {
  return (
    <circle
      cx={cx(i)}
      cy={cy(i)}
      r={R - 1}
      fill="none"
      stroke={next ? V.gold : V.rim}
      strokeOpacity={next ? 0.85 : 0.32}
      strokeWidth={next ? 2.4 : 1.8}
      strokeDasharray="4 5"
      className={next ? "animate-pulse" : undefined}
    />
  );
});

const Tick = memo(function Tick({ i }: { i: number }) {
  const col = i % COLS;
  const x = col === 0 ? COLS * CELL + 4 : col * CELL;
  const y = (col === 0 ? Math.floor(i / COLS) - 1 : Math.floor(i / COLS)) * CELL + CELL / 2;
  return <line x1={x} x2={x} y1={y - 15} y2={y + 15} stroke={V.white} strokeOpacity={0.9} strokeWidth={3} strokeLinecap="round" />;
});

type Props = {
  seq: string;
  n: number;
  label: string;
  svgRef?: Ref<SVGSVGElement>;
  ticks?: boolean;
  head?: number;
  glow?: boolean;
  mark?: { start: number; len: number } | null;
  stagger?: number;
  landDelay?: number;
};

export default function FlipGrid({ seq, n, label, svgRef, ticks = false, head, glow = false, mark = null, stagger = 0, landDelay = 0 }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const rows = rowsFor(n);
  const len = seq.length;
  const upTo = head === undefined ? len : head;
  const headAt = Math.min(Math.max(upTo, 0), Math.max(len - 1, 0));

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${COLS * CELL} ${rows * CELL}`}
      className="block h-auto w-full overflow-visible"
      style={{ aspectRatio: `${COLS * CELL} / ${rows * CELL}` }}
      role="img"
      aria-label={seq ? `${label}: ${seq.split("").join(" ")}` : label}
    >
      <defs>
        <radialGradient id={`${uid}-sh`}>
          <stop offset="0.8" stopColor="#000" stopOpacity={0.35} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {Array.from({ length: Math.max(0, n - len) }, (_, k) => (
        <Slot key={`s${len + k}`} i={len + k} next={k === 0 && !ticks} />
      ))}

      {mark &&
        segments(mark.start, mark.len).map((g) => (
          <rect
            key={`m${g.row}`}
            x={g.c0 * CELL + 2}
            y={g.row * CELL + 2}
            width={(g.c1 - g.c0 + 1) * CELL - 4}
            height={CELL - 4}
            rx={(CELL - 4) / 2}
            fill={V.gold}
            fillOpacity={0.12}
            stroke={V.gold}
            strokeWidth={2.4}
            className="animate-pop"
            style={POP}
          />
        ))}

      {Array.from({ length: len }, (_, i) => (
        <Fragment key={i}>
          {glow && i === headAt ? <circle cx={cx(i)} cy={cy(i)} r={R * 1.6} fill={seq[i] === "H" ? V.gold : V.cyan} fillOpacity={0.5} filter={`url(#${uid}-glow)`} /> : null}
          <Coin uid={uid} side={seq[i]} i={i} delay={stagger > 0 ? Math.round(i * stagger) : i === len - 1 ? landDelay : 0} />
        </Fragment>
      ))}

      {ticks &&
        Array.from({ length: Math.max(0, Math.min(len, upTo + 1) - 1) }, (_, k) => {
          const i = k + 1;
          if (seq[i] === seq[i - 1]) return null;
          return <Tick key={`t${i}`} i={i} />;
        })}
    </svg>
  );
}
