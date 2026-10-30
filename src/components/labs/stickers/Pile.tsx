"use client";

import { fmt } from "./config";

const SPOTS = [
  [6, 30, -14],
  [28, 33, 9],
  [50, 29, -6],
  [16, 18, 16],
  [40, 19, -18],
  [60, 22, 12],
  [26, 6, -8],
  [48, 8, 14],
  [8, 8, 5],
  [62, 6, -12],
  [34, -2, 8],
  [54, -4, -4],
];

export default function Pile({ count }: { count: number }) {
  const shown = Math.min(count, SPOTS.length);
  return (
    <div data-anchor="pile" role="img" className="relative h-[84px] w-[92px] shrink-0" aria-label={`Doubles pile: ${count}`}>
      <div className="absolute inset-x-0 bottom-5 top-0">
        {count === 0 && <div className="absolute inset-x-1 bottom-0 top-3 rounded-xl border border-dashed border-edge/40" />}
        {SPOTS.slice(0, shown).map(([x, y, r], i) => (
          <span
            key={i}
            className={`absolute h-7 w-7 rounded-md bg-[#6B7AA3] shadow-[inset_0_-3px_0_rgba(11,16,32,0.25),inset_3px_3px_0_rgba(255,255,255,0.18)] ${i === shown - 1 ? "animate-pop" : ""}`}
            style={{ left: x, top: y + 10, transform: `rotate(${r}deg)`, background: i % 2 ? "#6B7AA3" : "#7C8CB8" }}
          />
        ))}
        <span key={count} className={`absolute -right-1 top-0 rounded-full bg-coral px-2 py-0.5 text-xs font-black text-navy-950 num ${count > 0 ? "animate-crunch" : "opacity-50"}`}>
          {fmt(count)}
        </span>
      </div>
      <p className="absolute inset-x-0 bottom-0 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-mist">Doubles</p>
    </div>
  );
}
