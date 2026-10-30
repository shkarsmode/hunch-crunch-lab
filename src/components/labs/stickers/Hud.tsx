"use client";

import { FRIEND_FACES, fmt, fmtPacks } from "./config";

type StatProps = { label: string; value: string; sub?: string; tone: string; bumpKey?: number };

function Stat({ label, value, sub, tone, bumpKey }: StatProps) {
  return (
    <div className="min-w-0 rounded-xl bg-navy-950/45 px-2 py-1.5 text-center ring-1 ring-edge/15">
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-mist">{label}</p>
      <p key={bumpKey} className={`display num truncate text-[22px] font-black leading-7 sm:text-2xl ${tone} ${bumpKey ? "animate-crunch" : ""}`}>
        {value}
      </p>
      <p className="h-3.5 truncate text-[10px] leading-[14px] text-mist/80">{sub ?? " "}</p>
    </div>
  );
}

export function Friends({ shares }: { shares: number[] }) {
  if (shares.length === 0) return null;
  return (
    <div className="flex shrink-0 items-center gap-1.5" aria-label="Friends you swap with">
      {shares.map((s, i) => (
        <span
          key={i}
          data-friend={i}
          title={`Friend ${i + 1}: ${Math.round(s * 100)}% done`}
          className="grid h-8 w-8 place-items-center rounded-full"
          style={{ background: `conic-gradient(#3EE6A0 ${Math.round(s * 360)}deg, rgba(111,128,179,0.28) 0deg)` }}
        >
          <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-navy-900 text-[14px] leading-none">{FRIEND_FACES[i % FRIEND_FACES.length]}</span>
        </span>
      ))}
    </div>
  );
}

type HudProps = {
  className?: string;
  packs: number;
  owned: number;
  n: number;
  expected: number;
  easy: number;
  remaining: number | null;
  swapEst: number | null;
  friends: number;
  shares: number[];
  status: string;
  statusKey: number;
  done: boolean;
  smooth: boolean;
};

export default function Hud({ className = "", packs, owned, n, expected, easy, remaining, swapEst, friends, shares, status, statusKey, done, smooth }: HudProps) {
  const pct = n > 0 ? owned / n : 0;
  const pctText = pct >= 1 ? "100%" : pct > 0.995 ? "99%" : `${Math.floor(pct * 100)}%`;
  const expectedSub = friends > 0 && swapEst !== null ? `≈ ${fmt(Math.round(swapEst))} w/ friends` : `easy math: ${fmt(easy)}`;
  const packsSub = done ? "album full" : remaining !== null && owned > 0 ? `≈ ${fmtPacks(remaining)} to go` : "opened";
  return (
    <section className={`glass rounded-2xl p-2 ${className}`} aria-label="Album stats">
      <div className="grid grid-cols-3 gap-1.5">
        <Stat label="Packs" value={fmt(packs)} sub={packsSub} tone="text-ink" bumpKey={packs} />
        <Stat label="Expected" value={`≈ ${fmtPacks(expected)}`} sub={expectedSub} tone="text-gold" />
        <Stat label="Stickers" value={`${fmt(owned)}/${fmt(n)}`} sub={pctText} tone="text-mint" />
      </div>
      <div className="mt-2 px-1">
        <div className="h-2.5 overflow-hidden rounded-full bg-navy-950/70 ring-1 ring-edge/20" role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={owned} aria-label="Album progress">
          <div className={`h-full rounded-full bg-gradient-to-r from-mint to-cyan ${smooth ? "transition-[width] duration-300 ease-out" : ""}`} style={{ width: `${(pct * 100).toFixed(2)}%` }} />
        </div>
      </div>
      <div className="mt-1.5 flex min-h-8 items-center gap-2 px-1">
        <p key={statusKey} aria-live="polite" className="min-w-0 flex-1 animate-rise truncate text-[13px] font-semibold text-ink/90">
          {status}
        </p>
        <Friends shares={shares} />
      </div>
    </section>
  );
}
