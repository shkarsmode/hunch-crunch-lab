"use client";

import type { ReactNode } from "react";
import { Locked, LockIcon } from "@/components/access/AccessProvider";
import { Icon } from "@/components/ui/icons";
import { btn } from "@/components/ui/kit";
import { shortUrl } from "@/lib/site";
import { VIDEO_ID, fmt, fmtPacks, tap } from "./config";
import { harmonic, type Spec } from "./math";
import { MINT } from "./video";

export const SPEEDS = [
  { label: "Chill", rate: 2, instant: false, fast: false },
  { label: "Quick", rate: 8, instant: false, fast: true },
  { label: "Fast", rate: 40, instant: true, fast: false },
  { label: "Turbo", rate: 300, instant: true, fast: false },
];

const LINK = "inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-[12px] font-semibold transition hover:bg-white/[0.04] active:scale-[0.98]";

type SegProps<T> = { value: T; options: { v: T; label: ReactNode }[]; onChange: (v: T) => void; label: string; className?: string };

export function Seg<T extends string | number>({ value, options, onChange, label, className = "h-12" }: SegProps<T>) {
  const at = options.findIndex((o) => o.v === value);
  return (
    <div role="radiogroup" aria-label={label} className={`relative grid auto-cols-fr grid-flow-col rounded-xl border border-hair bg-white/[0.03] ${className}`}>
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-1 left-1 rounded-lg bg-white/[0.12] transition duration-200 ease-out ${at < 0 ? "opacity-0" : ""}`}
        style={{ width: `calc(100% / ${options.length} - 8px)`, transform: `translateX(calc(${Math.max(0, at)} * (100% + 8px)))` }}
      />
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          role="radio"
          aria-checked={o.v === value}
          onClick={() => onChange(o.v)}
          className={`relative flex min-w-0 touch-manipulation flex-col items-center justify-center px-1 font-mono text-[11px] uppercase leading-none tracking-[0.06em] transition ${
            o.v === value ? "text-ink" : "text-ink/45 hover:text-ink/80"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Friends({ shares }: { shares: number[] }) {
  if (shares.length === 0) return null;
  return (
    <div role="group" aria-label="Friends you swap with" className="flex items-center justify-center gap-2">
      <span aria-hidden className="mr-0.5 font-mono text-[10px] tracking-[0.12em] text-ink/40">
        FRIENDS
      </span>
      {shares.map((v, i) => (
        <span
          key={i}
          data-friend={i}
          title={`Friend ${i + 1}: ${Math.round(v * 100)}% done`}
          className="grid h-9 w-9 place-items-center rounded-full"
          style={{ background: `conic-gradient(${MINT} ${Math.round(v * 360)}deg, rgb(255 255 255 / 0.1) 0deg)` }}
        >
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-navy-850 font-mono text-[11px] text-ink/70">{i + 1}</span>
        </span>
      ))}
    </div>
  );
}

type Auto = { on: boolean; speed: number };

type PlayProps = {
  unlocked: boolean;
  upsell: (reason?: string) => void;
  disabled: boolean;
  auto: Auto;
  running: boolean;
  shares: number[];
  remaining: number | null;
  started: boolean;
  onRip: (n: number) => void;
  onAuto: () => void;
  onSpeed: (i: number) => void;
  setupOpen: boolean;
  onSetup: () => void;
};

export function PlayControls({ unlocked, disabled, auto, running, shares, remaining, started, onRip, onAuto, onSpeed, setupOpen, onSetup }: PlayProps) {
  return (
    <div className="flex flex-col gap-2">
      <Friends shares={shares} />
      <p className="h-4 truncate text-center font-mono text-[10px] uppercase leading-4 tracking-[0.1em] text-ink/45">
        {started && remaining !== null ? (
          <>
            <span className="text-cyan">≈ {fmtPacks(remaining)}</span> packs to go, on average
          </>
        ) : (
          "Tap the pack or the gold button"
        )}
      </p>
      <div className="portrait:[@media(max-height:560px)]:hidden">
        <Locked label="Auto-rip speed">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={onAuto}
              className={`flex h-12 w-[84px] shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-xl border text-[14px] font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${
                running ? "border-coral/40 bg-coral/[0.08] text-coral" : "border-hair-strong text-ink/85 hover:border-white/30 hover:text-ink"
              }`}
            >
              {running ? <Icon.Pause size={16} /> : <Icon.Play size={16} className="text-mint" />}
              {running ? "Stop" : "Auto"}
            </button>
            <Seg
              label="Auto-rip speed"
              className="h-12 min-w-0 flex-1"
              value={auto.speed}
              onChange={onSpeed}
              options={SPEEDS.map((sp, i) => ({
                v: i,
                label: (
                  <>
                    {sp.label}
                    <span className="mt-1 text-[9px] normal-case tracking-normal opacity-60">{sp.rate}/s</span>
                  </>
                ),
              }))}
            />
          </div>
        </Locked>
      </div>
      <div className="flex gap-2">
        <button type="button" disabled={disabled} onClick={() => onRip(1)} className={btn("primary", "lg", "min-w-0 flex-1 touch-manipulation")}>
          Rip a pack
        </button>
        <button type="button" disabled={disabled} onClick={() => onRip(10)} className={btn("ghost", "lg", "shrink-0 touch-manipulation")}>
          Rip 10
        </button>
        <button
          type="button"
          onClick={onSetup}
          data-sheet-trigger
          aria-expanded={setupOpen}
          aria-label="Album setup"
          className="relative flex h-[52px] shrink-0 items-center gap-1.5 rounded-xl border border-hair-strong px-3.5 text-[14px] font-medium text-ink/80 transition hover:text-ink active:scale-95"
        >
          <Icon.Sliders size={18} />
          <span className="max-[360px]:hidden">Album</span>
          {!unlocked && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-navy-900" />}
        </button>
      </div>
    </div>
  );
}

type EndProps = {
  spec: Spec;
  packs: number;
  easy: number;
  expected: number;
  friends: number;
  swapEst: number | null;
  unlocked: boolean;
  simOpen: boolean;
  onAgain: () => void;
  onSim: () => void;
  onUpsell: (reason?: string) => void;
};

function verdict(packs: number, expected: number) {
  const luck = packs / expected - 1;
  if (Math.abs(luck) < 0.05) return "Right on the average. Statistically boring, in the best way.";
  if (luck < 0) return `${Math.round(-luck * 100)}% fewer packs than the average collector. Lucky you!`;
  return `${Math.round(luck * 100)}% more packs than the average collector. The last few are brutal.`;
}

export function EndControls({ spec, packs, easy, expected, friends, swapEst, unlocked, simOpen, onAgain, onSim, onUpsell }: EndProps) {
  const h = harmonic(spec.n);
  const uniform = spec.nr === 0;
  return (
    <div className="enter flex flex-col gap-2">
      <p className="text-[14px] font-semibold leading-snug tracking-[-0.01em] text-ink">
        {verdict(packs, expected)} <span className="font-normal text-ink/50">Easy math said {fmt(easy)} packs.</span>
      </p>
      <p className="rounded-xl border border-hair bg-white/[0.025] px-3 py-2.5 text-[12.5px] leading-snug text-ink/60">
        <span className="font-semibold text-ink">Why so many?</span> Each new sticker is harder to find than the last.{" "}
        {uniform ? (
          <>
            On average you need <span className="font-semibold text-gold">n × H(n)</span> stickers, with H(n) = 1 + ½ + ⅓ + … + 1/n. Here {fmt(spec.n)} × {h.toFixed(2)} ≈ {fmt(Math.round(spec.n * h))}, so ≈ {fmtPacks(expected)} packs of {spec.k}.
          </>
        ) : (
          <>Rare stickers turn up 5× less often, so the last ones take even longer: ≈ {fmtPacks(expected)} packs on average.</>
        )}
        {friends > 0 && swapEst !== null && (
          <>
            {" "}
            With {friends} friend{friends > 1 ? "s" : ""} swapping doubles: ≈ <span className="font-semibold text-cyan">{fmt(Math.round(swapEst))}</span> packs each.
          </>
        )}
      </p>
      <div className="mt-0.5 flex gap-2">
        <button
          type="button"
          autoFocus
          onClick={() => {
            tap();
            onAgain();
          }}
          className={btn("primary", "lg", "min-w-0 flex-1 touch-manipulation")}
        >
          <Icon.Reset size={18} /> Play again
        </button>
        <button
          type="button"
          onClick={() => {
            tap();
            if (unlocked) onSim();
            else onUpsell("The 10,000-album simulator");
          }}
          data-sheet-trigger
          aria-expanded={simOpen}
          className={btn("ghost", "lg", "shrink-0 touch-manipulation")}
        >
          {!unlocked && <LockIcon className="h-3.5 w-3.5 text-gold" />}
          10,000 albums
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-1">
        <a href={shortUrl(VIDEO_ID)} target="_blank" rel="noreferrer" className={`${LINK} text-ink/60 hover:text-ink`}>
          <Icon.Youtube size={16} /> Watch the video
        </a>
        {!unlocked && (
          <button type="button" onClick={() => onUpsell("Albums up to 980 stickers")} className={`${LINK} text-gold/85 hover:text-gold`}>
            <LockIcon className="h-3.5 w-3.5" /> Try the 980-sticker album
          </button>
        )}
      </div>
      <p className="text-center text-[11px] text-ink/35">Album idea from @maximbarishov4120. Thank you!</p>
    </div>
  );
}
