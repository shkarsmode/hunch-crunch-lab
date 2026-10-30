"use client";

import { fmt } from "./config";
import type { Axis } from "./sim";

export type Series = { counts: number[]; color: string; opacity: number; label: string };

export type Marker = { at: number; label: string; color: string };

function lucky(t: number) {
  const a = [62, 230, 160];
  const b = [255, 92, 122];
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, Math.max(0, t))));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

export default function Histogram({ axis, series, markers, spread }: { axis: Axis | null; series: Series[]; markers: Marker[]; spread?: boolean }) {
  if (!axis) {
    return <div className="h-44 rounded-xl border border-dashed border-edge/30" />;
  }
  const span = axis.step * axis.bins;
  let max = 1;
  for (const s of series) for (const c of s.counts) if (c > max) max = c;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <figure className="m-0">
      <div className="relative" style={{ height: 150 + markers.length * 17, paddingTop: 8 + markers.length * 17 }}>
        <div role="img" aria-label="Histogram of the packs needed to fill the album" className="relative flex h-full items-end gap-px rounded-lg bg-navy-950/50 px-1 pt-1 ring-1 ring-edge/15">
          {Array.from({ length: axis.bins }, (_, b) => (
            <div key={b} className="relative h-full min-w-0 flex-1">
              {series.map((s) => (
                <div
                  key={s.label}
                  className="absolute inset-x-0 bottom-0 rounded-t-[3px] transition-[height] duration-200 ease-out"
                  style={{ height: `${((s.counts[b] ?? 0) / max) * 100}%`, background: spread ? lucky(b / (axis.bins - 1)) : s.color, opacity: s.opacity }}
                />
              ))}
            </div>
          ))}
        </div>
        {markers.map((m, i) => {
          const f = (m.at - axis.lo) / span;
          const inside = f >= 0 && f <= 1;
          const left = Math.min(1, Math.max(0, f));
          const align = left < 0.18 ? "0%" : left > 0.82 ? "-100%" : "-50%";
          return (
            <div key={m.label} className="pointer-events-none absolute inset-y-0 w-0" style={{ left: `calc(4px + (100% - 8px) * ${left})` }}>
              {inside && <div className="absolute bottom-0 border-l-2 border-dashed" style={{ borderColor: m.color, top: i * 17 + 20 }} />}
              <span
                className="absolute whitespace-nowrap rounded-full bg-navy-950/90 px-2 py-0.5 text-[10px] font-bold"
                style={{ color: m.color, top: i * 17, transform: `translateX(${align})`, boxShadow: `0 0 0 1px ${m.color}` }}
              >
                {!inside && f < 0 ? "← " : ""}
                {m.label}
                {!inside && f > 1 ? " →" : ""}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative mx-1 mt-1 h-4 text-[10px] font-semibold text-mist">
        {ticks.map((t) => (
          <span key={t} className="num absolute whitespace-nowrap" style={{ left: `${t * 100}%`, transform: `translateX(${-t * 100}%)` }}>
            {fmt(Math.round(axis.lo + span * t))}
          </span>
        ))}
      </div>
      <figcaption className="mt-1 text-center text-[11px] text-mist">Packs needed to fill the album</figcaption>
    </figure>
  );
}
