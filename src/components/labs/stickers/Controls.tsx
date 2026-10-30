"use client";

import type { CSSProperties } from "react";
import { Locked, LockIcon } from "@/components/access/AccessProvider";
import { shortUrl } from "@/lib/site";
import { FRIEND_FACES, VIDEO_ID, fmt, fmtPacks, tap } from "./config";
import { harmonic, type Spec } from "./math";
import { CYAN, DEEP, DISPLAY, GOLD, INK, LABEL, MINT, MUTED, PANEL_LINE, SOFT, WHITE, CORAL, rgba } from "./video";

export const SPEEDS = [
  { label: "Chill", rate: 2, instant: false, fast: false },
  { label: "Quick", rate: 8, instant: false, fast: true },
  { label: "Fast", rate: 40, instant: true, fast: false },
  { label: "Turbo", rate: 300, instant: true, fast: false },
];

const pill = (color: string): CSSProperties => ({
  background: rgba(color, 0.95),
  boxShadow: `0 0 20px ${rgba(color, 0.35)}`,
  color: INK,
  ...DISPLAY,
});

function Friends({ shares }: { shares: number[] }) {
  if (shares.length === 0) return null;
  return (
    <div className="flex items-center justify-center gap-2" aria-label="Friends you swap with">
      {shares.map((v, i) => (
        <span
          key={i}
          data-friend={i}
          title={`Friend ${i + 1}: ${Math.round(v * 100)}% done`}
          className="grid h-9 w-9 place-items-center rounded-full"
          style={{ background: `conic-gradient(${MINT} ${Math.round(v * 360)}deg, ${rgba(PANEL_LINE, 0.9)} 0deg)` }}
        >
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full text-[16px] leading-none" style={{ background: "#0B1124" }}>
            {FRIEND_FACES[i % FRIEND_FACES.length]}
          </span>
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
};

export function PlayControls({ disabled, auto, running, shares, remaining, started, onRip, onAuto, onSpeed }: PlayProps) {
  const autoRow = (
    <div className="flex items-center gap-1 rounded-full p-1" style={{ background: rgba(DEEP, 0.9), boxShadow: `0 0 0 1px ${PANEL_LINE}` }}>
      <button
        type="button"
        disabled={disabled}
        onClick={onAuto}
        className="h-11 w-[84px] shrink-0 touch-manipulation rounded-full text-sm transition active:scale-95 disabled:opacity-50"
        style={{ ...DISPLAY, background: running ? CORAL : MINT, color: INK }}
      >
        {running ? "■ Stop" : "▶ Auto"}
      </button>
      {SPEEDS.map((sp, i) => (
        <button
          key={sp.label}
          type="button"
          aria-pressed={auto.speed === i}
          onClick={() => onSpeed(i)}
          className="h-11 min-w-0 flex-1 touch-manipulation rounded-full text-[12px] leading-tight transition active:scale-95"
          style={{ ...DISPLAY, fontWeight: 700, background: auto.speed === i ? WHITE : "transparent", color: auto.speed === i ? INK : MUTED }}
        >
          {sp.label}
          <span className="block text-[9px] opacity-70" style={LABEL}>
            {sp.rate}/s
          </span>
        </button>
      ))}
    </div>
  );
  return (
    <div className="flex flex-col gap-2">
      <Friends shares={shares} />
      <p className="h-4 text-center text-[11px] uppercase tracking-[0.12em]" style={{ ...LABEL, color: MUTED }}>
        {started && remaining !== null ? (
          <>
            <span style={{ color: CYAN }}>≈ {fmtPacks(remaining)}</span> packs to go, on average
          </>
        ) : (
          "Tap the pack or the gold button"
        )}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRip(1)}
          className="h-14 min-w-0 flex-1 touch-manipulation rounded-full px-4 text-xl transition active:scale-[0.97] disabled:opacity-50"
          style={pill(GOLD)}
        >
          Rip a pack
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRip(10)}
          className="h-14 w-[112px] shrink-0 touch-manipulation rounded-full text-xl transition active:scale-[0.97] disabled:opacity-50"
          style={pill(CYAN)}
        >
          Rip 10
        </button>
      </div>
      <div className="portrait:[@media(max-height:560px)]:hidden">
        <Locked label="Auto-rip speed">{autoRow}</Locked>
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

export function EndControls({ spec, packs, easy, expected, friends, swapEst, unlocked, onAgain, onSim, onUpsell }: EndProps) {
  const h = harmonic(spec.n);
  const uniform = spec.nr === 0;
  return (
    <div className="flex flex-col gap-2 text-center">
      <p className="text-[13.5px] leading-snug" style={{ color: WHITE, ...DISPLAY, fontWeight: 700 }}>
        {verdict(packs, expected)} <span style={{ color: MUTED, ...LABEL }}>Easy math said {fmt(easy)} packs.</span>
      </p>
      <p className="rounded-2xl px-3 py-2 text-left text-[12.5px] leading-snug" style={{ background: "#0B1124", color: SOFT, boxShadow: `0 0 0 1px ${PANEL_LINE}`, ...LABEL }}>
        <span style={{ color: WHITE, ...DISPLAY, fontWeight: 700 }}>Why so many?</span> Each new sticker is harder to find than the last.{" "}
        {uniform ? (
          <>
            On average you need <span style={{ color: GOLD, fontWeight: 700 }}>n × H(n)</span> stickers, with H(n) = 1 + ½ + ⅓ + … + 1/n. Here {fmt(spec.n)} × {h.toFixed(2)} ≈ {fmt(Math.round(spec.n * h))}, so ≈ {fmtPacks(expected)} packs of {spec.k}.
          </>
        ) : (
          <>Rare stickers turn up 5× less often, so the last ones take even longer: ≈ {fmtPacks(expected)} packs on average.</>
        )}
        {friends > 0 && swapEst !== null && (
          <>
            {" "}
            With {friends} friend{friends > 1 ? "s" : ""} swapping doubles: ≈ <span style={{ color: CYAN, fontWeight: 700 }}>{fmt(Math.round(swapEst))}</span> packs each.
          </>
        )}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          autoFocus
          onClick={() => {
            tap();
            onAgain();
          }}
          className="h-12 min-w-0 flex-1 touch-manipulation rounded-full px-4 text-lg transition active:scale-[0.97]"
          style={pill(GOLD)}
        >
          Play again
        </button>
        <button
          type="button"
          onClick={() => {
            tap();
            if (unlocked) onSim();
            else onUpsell("The 10,000-album simulator");
          }}
          className="flex h-12 shrink-0 touch-manipulation items-center gap-1.5 rounded-full px-4 text-[15px] transition active:scale-[0.97]"
          style={pill(CYAN)}
        >
          {!unlocked && <LockIcon className="h-4 w-4" />}
          10,000 albums
        </button>
      </div>
      <div className="flex items-center justify-center gap-4 text-xs">
        <a href={shortUrl(VIDEO_ID)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center underline-offset-4 hover:underline" style={{ color: CORAL, ...LABEL }}>
          Watch the video
        </a>
        {!unlocked && (
          <button type="button" onClick={() => onUpsell("Albums up to 980 stickers")} className="inline-flex h-11 items-center underline-offset-4 hover:underline" style={{ color: GOLD, ...LABEL }}>
            Try the 980-sticker album
          </button>
        )}
      </div>
      <p className="text-[11px]" style={{ color: MUTED, ...LABEL }}>
        Album idea from @maximbarishov4120. Thank you!
      </p>
    </div>
  );
}
