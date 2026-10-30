"use client";

import { useId } from "react";
import type { Tier } from "@/lib/tiers";

type TierId = Tier["id"];

const NAMES: Record<TierId, string> = {
  coin: "Coin Flipper",
  dice: "Dice Roller",
  streak: "Lucky Streak",
  golden: "Golden Crunch",
  million: "One in a Million",
};

const GLOW: Record<TierId, string> = {
  coin: "#B9C6E4",
  dice: "#3FE0FF",
  streak: "#3EE6A0",
  golden: "#FFC94A",
  million: "#FF7AD9",
};

const pts = (n: number, r: number, start: number, cx = 60, cy = 60) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((start + (360 / n) * i) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
const poly = (p: readonly (readonly [number, number])[]) => p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
const star = (n: number, ro: number, ri: number, start: number) =>
  poly(
    Array.from({ length: n * 2 }, (_, i) => {
      const r = i % 2 ? ri : ro;
      const a = ((start + (180 / n) * i) * Math.PI) / 180;
      return [60 + r * Math.cos(a), 60 + r * Math.sin(a)] as const;
    }),
  );

// The channel mark: Crunchy's rounded square with the bite out of the top-right corner.
function BiteMask({ id, s, cx = 60, cy = 60 }: { id: string; s: number; cx?: number; cy?: number }) {
  return (
    <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
      <rect width="120" height="120" fill="#fff" />
      <circle cx={cx + 0.98 * s} cy={cy - 0.58 * s} r={0.37 * s} fill="#000" />
      <circle cx={cx + 0.58 * s} cy={cy - 0.98 * s} r={0.37 * s} fill="#000" />
    </mask>
  );
}

export default function Emblem({
  tier,
  size = 96,
  founder = false,
  muted = false,
  className = "",
}: {
  tier: TierId;
  size?: number;
  founder?: boolean;
  muted?: boolean;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const k = (s: string) => `${id}${s}`;
  const u = (s: string) => `url(#${k(s)})`;
  const hex = pts(6, 46, -90);
  const hexIn = pts(6, 27, -90, 60, 58);
  const oct = poly(pts(8, 45, 22.5));
  const octIn = poly(pts(8, 37, 22.5));
  const clip =
    tier === "coin" ? (
      <circle cx="60" cy="60" r="46" />
    ) : tier === "dice" ? (
      <rect x="26" y="24" width="68" height="68" rx="18" />
    ) : tier === "streak" ? (
      <polygon points={poly(hex)} />
    ) : tier === "golden" ? (
      <polygon points={oct} />
    ) : (
      <polygon points={star(8, 50, 39, -90)} />
    );

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`emblem emblem-${tier} ${muted ? "emblem-muted" : ""} ${className}`}
      role="img"
      aria-label={`${NAMES[tier]}${founder ? ", founder" : ""}`}
    >
      <defs>
        <radialGradient id={k("glow")}>
          <stop offset="0%" stopColor={GLOW[tier]} stopOpacity="0.42" />
          <stop offset="62%" stopColor={GLOW[tier]} stopOpacity="0.08" />
          <stop offset="100%" stopColor={GLOW[tier]} stopOpacity="0" />
        </radialGradient>
        <filter id={k("drop")} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="5" stdDeviation="4.5" floodColor="#020409" floodOpacity="0.55" />
        </filter>
        <linearGradient id={k("shine")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={k("spec")} cx="0.32" cy="0.26" r="0.62">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={k("clip")}>{clip}</clipPath>

        {tier === "coin" && (
          <>
            <linearGradient id={k("rim")} x1="0.2" y1="0.05" x2="0.8" y2="0.95">
              <stop offset="0" stopColor="#F7F9FD" />
              <stop offset="0.45" stopColor="#9AA6C2" />
              <stop offset="0.7" stopColor="#626E8E" />
              <stop offset="1" stopColor="#C9D1E3" />
            </linearGradient>
            <linearGradient id={k("bevel")} x1="0.2" y1="0.05" x2="0.8" y2="0.95">
              <stop offset="0" stopColor="#6F7B9B" />
              <stop offset="1" stopColor="#EEF2F9" />
            </linearGradient>
            <linearGradient id={k("face")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#EDF1F8" />
              <stop offset="0.3" stopColor="#BAC4D9" />
              <stop offset="0.48" stopColor="#F1F4FA" />
              <stop offset="0.68" stopColor="#A6B1C9" />
              <stop offset="1" stopColor="#D8DEEA" />
            </linearGradient>
            <linearGradient id={k("mark")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FBFCFE" />
              <stop offset="1" stopColor="#B4BED3" />
            </linearGradient>
            <BiteMask id={k("bite")} s={16} />
          </>
        )}

        {tier === "dice" && (
          <>
            <linearGradient id={k("face")} x1="0.15" y1="0" x2="0.85" y2="1">
              <stop offset="0" stopColor="#B5F7FF" />
              <stop offset="0.35" stopColor="#4FE3FF" />
              <stop offset="1" stopColor="#0C7FAE" />
            </linearGradient>
            <linearGradient id={k("side")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0B6A92" />
              <stop offset="1" stopColor="#063A55" />
            </linearGradient>
            <radialGradient id={k("pip")} cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#021725" />
              <stop offset="0.7" stopColor="#043049" />
              <stop offset="1" stopColor="#1B9CC7" />
            </radialGradient>
          </>
        )}

        {tier === "streak" && (
          <>
            <linearGradient id={k("table")} x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0" stopColor="#A9FFDF" />
              <stop offset="0.5" stopColor="#3EE6A0" />
              <stop offset="1" stopColor="#14A56E" />
            </linearGradient>
            <linearGradient id={k("bolt")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#D2FFEE" />
            </linearGradient>
          </>
        )}

        {tier === "golden" && (
          <>
            <linearGradient id={k("rim")} x1="0.15" y1="0" x2="0.85" y2="1">
              <stop offset="0" stopColor="#FFF6CF" />
              <stop offset="0.35" stopColor="#FFC94A" />
              <stop offset="0.7" stopColor="#A86F12" />
              <stop offset="1" stopColor="#FFE291" />
            </linearGradient>
            <radialGradient id={k("face")} cx="0.38" cy="0.32" r="0.75">
              <stop offset="0" stopColor="#FFEDB5" />
              <stop offset="0.55" stopColor="#F4B63A" />
              <stop offset="1" stopColor="#B57A16" />
            </radialGradient>
            <linearGradient id={k("mark")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFF3C9" />
              <stop offset="1" stopColor="#FFC94A" />
            </linearGradient>
            <linearGradient id={k("leaf")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFE08A" />
              <stop offset="1" stopColor="#B07A16" />
            </linearGradient>
            <BiteMask id={k("bite")} s={17} cy={61} />
          </>
        )}

        {tier === "million" && (
          <>
            <linearGradient id={k("holo")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7DF3FF" />
              <stop offset="0.25" stopColor="#B69CFF" />
              <stop offset="0.5" stopColor="#FF7AD9" />
              <stop offset="0.75" stopColor="#FFD166" />
              <stop offset="1" stopColor="#5CF2B4" />
            </linearGradient>
            <linearGradient id={k("holo2")} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.35" />
            </linearGradient>
            <radialGradient id={k("core")} cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#1D2650" />
              <stop offset="1" stopColor="#070A18" />
            </radialGradient>
          </>
        )}
      </defs>

      <circle cx="60" cy="62" r="58" fill={u("glow")} className="emblem-glow" />

      <g filter={u("drop")}>
        {tier === "coin" && (
          <>
            <circle cx="60" cy="60" r="46" fill={u("rim")} />
            <circle cx="60" cy="60" r="44.2" fill="none" stroke="#3B4565" strokeOpacity="0.55" strokeWidth="2.6" strokeDasharray="1.1 1.5" />
            <circle cx="60" cy="60" r="40.6" fill={u("bevel")} />
            <circle cx="60" cy="60" r="38.4" fill={u("face")} />
            <circle cx="60" cy="60" r="38.4" fill={u("spec")} />
            <g mask={u("bite")}>
              <rect x="45.4" y="46.4" width="32" height="32" rx="9" fill="#5A6684" opacity="0.65" />
              <rect x="44" y="44" width="32" height="32" rx="9" fill={u("mark")} />
              <rect x="44.5" y="44.5" width="31" height="31" rx="8.6" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.9" />
            </g>
          </>
        )}

        {tier === "dice" && (
          <>
            <rect x="26" y="31" width="68" height="68" rx="18" fill={u("side")} />
            <rect x="26" y="24" width="68" height="68" rx="18" fill={u("face")} />
            <rect x="27.5" y="25.5" width="65" height="65" rx="16.6" fill="none" stroke="#E9FDFF" strokeOpacity="0.75" strokeWidth="1.2" />
            <rect x="26" y="24" width="68" height="68" rx="18" fill={u("spec")} />
            {[
              [44, 42],
              [76, 42],
              [60, 58],
              [44, 74],
              [76, 74],
            ].map(([x, y]) => (
              <g key={`${x}-${y}`}>
                <circle cx={x} cy={y + 0.9} r="6" fill="#E9FDFF" opacity="0.45" />
                <circle cx={x} cy={y} r="5.6" fill={u("pip")} />
              </g>
            ))}
          </>
        )}

        {tier === "streak" && (
          <>
            {hex.map((a, i) => {
              const b = hex[(i + 1) % 6];
              const c = hexIn[(i + 1) % 6];
              const d = hexIn[i];
              const shade = ["#C9FFEB", "#7AF5C4", "#1FB57B", "#0A7350", "#0E8A5E", "#5AE8B0"][i];
              return <polygon key={i} points={poly([a, b, c, d])} fill={shade} />;
            })}
            <polygon points={poly(hexIn)} fill={u("table")} />
            <polygon points={poly(hexIn)} fill={u("spec")} />
            <polygon points={poly(hex)} fill="none" stroke="#EAFFF7" strokeOpacity="0.5" strokeWidth="1" strokeLinejoin="round" />
            <path d="M63.5 41.5 L50.5 61 H59 L55.5 76.5 L69.5 55.5 H60.8 Z" fill="#06573A" opacity="0.6" transform="translate(1.1 1.5)" />
            <path d="M63.5 41.5 L50.5 61 H59 L55.5 76.5 L69.5 55.5 H60.8 Z" fill={u("bolt")} />
          </>
        )}

        {tier === "golden" && (
          <>
            {[-1, 1].map((side) => (
              <g key={side} transform={`translate(60 60) scale(${side} 1)`}>
                {[0, 1, 2, 3, 4].map((i) => {
                  const deg = 78 - i * 24;
                  const a = (deg * Math.PI) / 180;
                  const x = 50 * Math.cos(a);
                  const y = 50 * Math.sin(a);
                  return <ellipse key={i} cx={x} cy={y} rx="3.4" ry="8.4" fill={u("leaf")} transform={`rotate(${deg - 28} ${x} ${y})`} />;
                })}
              </g>
            ))}
            <polygon points={oct} fill={u("rim")} strokeLinejoin="round" stroke="#FFE7A3" strokeWidth="1.2" />
            <polygon points={octIn} fill={u("face")} />
            <polygon points={octIn} fill={u("spec")} />
            <g mask={u("bite")}>
              <rect x="44.6" y="46.6" width="34" height="34" rx="10" fill="#7A520B" opacity="0.6" />
              <rect x="43" y="44" width="34" height="34" rx="10" fill={u("mark")} />
            </g>
            <path d="M48.5 55.2 Q52.5 52.8 56.5 54.2" stroke="#6B470A" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="52.6" cy="60.4" r="3.3" fill="#5A3B07" />
            <circle cx="53.6" cy="59.4" r="1" fill="#FFF3C9" />
            <ellipse cx="66.4" cy="61" rx="3.6" ry="2.6" fill="#5A3B07" />
            <circle cx="67.4" cy="60.2" r="0.9" fill="#FFF3C9" />
            <path d="M52.5 68.6 Q59 72.6 66 67" stroke="#5A3B07" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        )}

        {tier === "million" && (
          <>
            <polygon points={star(8, 50, 39, -90)} fill={u("holo")} stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" strokeLinejoin="round" className="emblem-holo" />
            <polygon points={star(8, 50, 39, -90)} fill={u("holo2")} />
            <circle cx="60" cy="60" r="27" fill="#ffffff" fillOpacity="0.85" />
            <circle cx="60" cy="60" r="25.5" fill={u("core")} />
            <circle cx="60" cy="60" r="25.5" fill={u("spec")} opacity="0.5" />
            <text x="60" y="65" textAnchor="middle" fontSize="15" fontWeight="900" fill="#FFFFFF" fontFamily="var(--font-inter), system-ui, sans-serif" letterSpacing="-0.5">
              1:1M
            </text>
            {[
              [24, 26, 3.2],
              [98, 34, 2.4],
              [94, 96, 2.8],
            ].map(([x, y, r], i) => (
              <path
                key={i}
                className="emblem-sparkle"
                style={{ animationDelay: `${i * 0.7}s` }}
                d={`M${x} ${y - r * 2} Q${x} ${y} ${x + r * 2} ${y} Q${x} ${y} ${x} ${y + r * 2} Q${x} ${y} ${x - r * 2} ${y} Q${x} ${y} ${x} ${y - r * 2} Z`}
                fill="#fff"
              />
            ))}
          </>
        )}
      </g>

      <g clipPath={u("clip")}>
        <rect className="emblem-shine" x="-40" y="-20" width="28" height="160" fill={u("shine")} transform="rotate(20 60 60)" />
      </g>

      {founder && (
        <g className="emblem-founder">
          <circle cx="60" cy="60" r="56" fill="none" stroke="#FFC94A" strokeWidth="1.6" strokeOpacity="0.9" strokeDasharray="2 3.2" />
          <path d="M60 0.8 l2.3 4.6 5 .7 -3.6 3.5 .9 5 -4.6 -2.4 -4.6 2.4 .9 -5 -3.6 -3.5 5 -.7 z" fill="#FFC94A" />
        </g>
      )}
    </svg>
  );
}
