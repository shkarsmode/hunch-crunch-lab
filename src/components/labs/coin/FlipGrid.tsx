"use client";

import { memo, useEffect, useId, useState, type Ref } from "react";

export const COLS = 20;
const CELL = 10;
const GOLD = "#FFC94A";
const POP = { transformBox: "fill-box", transformOrigin: "center" } as const;

export function rowsFor(n: number): number {
  return Math.ceil(n / COLS);
}

export function cellRect(svg: SVGSVGElement, i: number, n: number): DOMRect {
  const r = svg.getBoundingClientRect();
  const cw = r.width / COLS;
  const ch = r.height / rowsFor(n);
  const d = cw * 0.78;
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

const Coin = memo(function Coin({ uid, side, i, delay }: { uid: string; side: string; i: number; delay: number }) {
  return (
    <g transform={`translate(${(i % COLS) * CELL + CELL / 2} ${Math.floor(i / COLS) * CELL + CELL / 2})`}>
      <g className="animate-pop" style={{ ...POP, animationDelay: `${delay}ms` }}>
        <circle r={3.9} fill={`url(#${uid}-${side})`} />
        <circle r={3.05} fill="none" stroke="#fff" strokeOpacity={0.38} strokeWidth={0.3} />
        <text y={0.2} textAnchor="middle" dominantBaseline="central" fontSize={4.4} fontWeight={900} fill="#0B1020">
          {side}
        </text>
      </g>
    </g>
  );
});

const Slot = memo(function Slot({ i, next }: { i: number; next: boolean }) {
  return (
    <circle
      cx={(i % COLS) * CELL + CELL / 2}
      cy={Math.floor(i / COLS) * CELL + CELL / 2}
      r={3.5}
      fill="none"
      stroke={next ? GOLD : "#6F80B3"}
      strokeOpacity={next ? 0.8 : 0.4}
      strokeWidth={0.4}
      strokeDasharray="0.9 1.1"
      className={next ? "animate-pulse" : undefined}
    />
  );
});

const Tick = memo(function Tick({ i }: { i: number }) {
  const col = i % COLS;
  const x = col === 0 ? COLS * CELL : col * CELL;
  const y = (col === 0 ? Math.floor(i / COLS) - 1 : Math.floor(i / COLS)) * CELL + CELL / 2;
  return <line x1={x} x2={x} y1={y - 2.8} y2={y + 2.8} stroke="#F4F6FB" strokeWidth={0.7} strokeLinecap="round" />;
});

const BATCHES = 10;

function Ticks({ seq, scanMs }: { seq: string; scanMs: number }) {
  const [on, setOn] = useState(scanMs <= 0);
  useEffect(() => {
    if (scanMs <= 0) return;
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, [scanMs]);
  const len = seq.length;
  const groups: number[][] = Array.from({ length: BATCHES }, () => []);
  for (let i = 1; i < len; i++) {
    if (seq[i] !== seq[i - 1]) groups[Math.min(BATCHES - 1, Math.floor((i / len) * BATCHES))].push(i);
  }
  return (
    <>
      {groups.map((g, b) =>
        g.length ? (
          <g key={b} className="transition-opacity duration-300" style={{ opacity: on ? 1 : 0, transitionDelay: `${Math.round((b / BATCHES) * scanMs)}ms` }}>
            {g.map((i) => (
              <Tick key={i} i={i} />
            ))}
          </g>
        ) : null,
      )}
    </>
  );
}

type Props = {
  seq: string;
  n: number;
  label: string;
  svgRef?: Ref<SVGSVGElement>;
  ticks?: boolean;
  scanMs?: number;
  mark?: { start: number; len: number } | null;
  stagger?: number;
  landDelay?: number;
};

export default function FlipGrid({ seq, n, label, svgRef, ticks = false, scanMs = 0, mark = null, stagger = 0, landDelay = 0 }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const rows = rowsFor(n);
  const len = seq.length;

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
        <radialGradient id={`${uid}-H`} cx="34%" cy="26%" r="80%">
          <stop offset="0" stopColor="#fff3c0" />
          <stop offset="0.25" stopColor="#ffd870" />
          <stop offset="0.55" stopColor="#ffc94a" />
          <stop offset="1" stopColor="#c98f22" />
        </radialGradient>
        <radialGradient id={`${uid}-T`} cx="34%" cy="26%" r="80%">
          <stop offset="0" stopColor="#e6fbff" />
          <stop offset="0.25" stopColor="#8aeeff" />
          <stop offset="0.55" stopColor="#3fe0ff" />
          <stop offset="1" stopColor="#1a8fae" />
        </radialGradient>
      </defs>

      {Array.from({ length: Math.max(0, n - len) }, (_, k) => (
        <Slot key={`s${len + k}`} i={len + k} next={k === 0 && !ticks} />
      ))}

      {mark &&
        segments(mark.start, mark.len).map((g) => (
          <rect
            key={`m${g.row}`}
            x={g.c0 * CELL + 0.6}
            y={g.row * CELL + 0.7}
            width={(g.c1 - g.c0 + 1) * CELL - 1.2}
            height={CELL - 1.4}
            rx={(CELL - 1.4) / 2}
            fill={GOLD}
            fillOpacity={0.12}
            stroke={GOLD}
            strokeWidth={0.55}
            className="animate-pop"
            style={POP}
          />
        ))}

      {Array.from({ length: len }, (_, i) => (
        <Coin key={i} uid={uid} side={seq[i]} i={i} delay={stagger > 0 ? Math.round(i * stagger) : i === len - 1 ? landDelay : 0} />
      ))}

      {ticks && <Ticks seq={seq} scanMs={scanMs} />}
    </svg>
  );
}
