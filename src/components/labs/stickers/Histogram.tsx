"use client";

import { fmt } from "./config";
import type { Axis } from "./sim";
import { CORAL, DEEP, DISPLAY, INK, LABEL, MINT, MUTED, rgba, mixHex } from "./video";

export type Series = { counts: number[]; color: string; opacity: number; label: string };

export type Marker = { at: number; label: string; color: string; dashed?: boolean };

type Props = { axis: Axis | null; series: Series[]; markers: Marker[]; colorRef?: number };

export default function Histogram({ axis, series, markers, colorRef }: Props) {
  if (!axis) {
    return <div className="h-52 rounded-[22px]" style={{ background: rgba(DEEP, 0.9) }} />;
  }
  const span = axis.step * axis.bins;
  let max = 1;
  for (const s of series) for (const c of s.counts) if (c > max) max = c;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const top = 8 + markers.length * 26;
  return (
    <figure className="m-0 rounded-[22px] p-3 pb-2" style={{ background: rgba(DEEP, 0.9) }}>
      <div className="relative" style={{ height: 150 + markers.length * 26, paddingTop: top }}>
        <div role="img" aria-label="Histogram of the packs needed to fill the album" className="relative flex h-full items-end gap-px" style={{ borderBottom: "3px solid #3A4C80" }}>
          {Array.from({ length: axis.bins }, (_, b) => {
            const centre = axis.lo + axis.step * (b + 0.5);
            const t = colorRef ? (centre - colorRef * 0.86) / (colorRef * 0.57) : b / Math.max(1, axis.bins - 1);
            return (
              <div key={b} className="relative h-full min-w-0 flex-1">
                {series.map((s) => (
                  <div
                    key={s.label}
                    className="absolute inset-x-0 bottom-0 transition-[height] duration-200 ease-out"
                    style={{ height: `${((s.counts[b] ?? 0) / max) * 100}%`, background: series.length === 1 ? mixHex(MINT, CORAL, t) : s.color, opacity: s.opacity }}
                  />
                ))}
              </div>
            );
          })}
        </div>
        {markers.map((m, i) => {
          const f = (m.at - axis.lo) / span;
          const inside = f >= 0 && f <= 1;
          const left = Math.min(1, Math.max(0, f));
          const align = left < 0.2 ? "0%" : left > 0.8 ? "-100%" : "-50%";
          return (
            <div key={m.label} className="pointer-events-none absolute inset-y-0 w-0" style={{ left: `${left * 100}%` }}>
              {inside && <div className="absolute bottom-0 border-l-[2.5px] border-dashed" style={{ borderColor: m.color, top: i * 26 + 24 }} />}
              <span
                className="absolute whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px]"
                style={{ top: i * 26, transform: `translateX(${align})`, background: rgba(m.color, 0.95), boxShadow: `0 0 12px ${rgba(m.color, 0.35)}`, color: INK, ...DISPLAY }}
              >
                {!inside && f < 0 ? "← " : ""}
                {m.label}
                {!inside && f > 1 ? " →" : ""}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative mt-1.5 h-4 text-[11px]" style={{ color: MUTED, ...LABEL }}>
        {ticks.map((t) => (
          <span key={t} className="absolute whitespace-nowrap" style={{ left: `${t * 100}%`, transform: `translateX(${-t * 100}%)`, fontVariantNumeric: "tabular-nums" }}>
            {fmt(Math.round(axis.lo + span * t))}
          </span>
        ))}
      </div>
      <figcaption className="mt-1 text-center text-[10px] uppercase tracking-[0.1em]" style={{ color: MUTED, ...LABEL }}>
        Packs to fill the album
      </figcaption>
    </figure>
  );
}
