import type { CSSProperties, ReactNode } from "react";
import Crunchy, { type CrunchyMood } from "@/components/Crunchy";

export const V = {
  gold: "#FFC94A",
  cyan: "#3FE0FF",
  coral: "#FF5C7A",
  mint: "#3EE6A0",
  white: "#F4F6FB",
  ink: "#0A0F1F",
  muted: "#8D9AB8",
  rim: "#A9B6D3",
  panel: "#0C1430",
  slate: "#7C8BB5",
  axis: "#3A4C80",
  shade: "#070B17",
} as const;

export type Tone = "idle" | "ok" | "bad";

export function toneColor(tone: Tone): string {
  return tone === "ok" ? V.mint : tone === "bad" ? V.coral : V.rim;
}

export const u = (n: number): string => `calc(${n} * var(--u))`;

export const EXTRA: CSSProperties = { fontWeight: 800, fontVariationSettings: '"opsz" 32' };
export const SEMI: CSSProperties = { fontWeight: 600, fontVariationSettings: '"opsz" 14' };

export const UNIT = { "--u": "calc(min(100cqw, 36rem) / 1080)" } as CSSProperties;

export function SceneBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(180deg, ${V.ink}, #131C38)` }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgb(127 156 255 / 0.045) 0 ${u(1.5)}, transparent ${u(1.5)}), linear-gradient(90deg, rgb(127 156 255 / 0.045) 0 ${u(1.5)}, transparent ${u(1.5)})`,
          backgroundSize: `${u(54)} ${u(54)}`,
        }}
      />
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle ${u(1440)} at 50% 48%, rgb(0 0 0 / 0), rgb(0 0 0 / 0.55))` }} />
      <div className="absolute inset-x-0 top-0" style={{ height: u(640), background: "linear-gradient(180deg, rgb(7 11 23 / 0.92), rgb(7 11 23 / 0))" }} />
    </div>
  );
}

export function VPill({ children, color, size = 28, ink = V.ink, className = "" }: { children: ReactNode; color: string; size?: number; ink?: string; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap ${className}`}
      style={{
        ...EXTRA,
        fontSize: u(size),
        lineHeight: 1,
        height: u(size * 1.55),
        padding: `0 ${u(size * 0.55)}`,
        borderRadius: 9999,
        background: `${color}F2`,
        boxShadow: `0 0 ${u(20)} ${color}59`,
        color: ink,
        transition: "background-color .3s, box-shadow .3s",
      }}
    >
      {children}
    </span>
  );
}

export function QMark({ height }: { height: number }) {
  return (
    <svg viewBox="0 0 110 170" style={{ height: u(height), width: u((height * 110) / 170), filter: "drop-shadow(0 6px 10px rgb(0 0 0 / 0.45))" }} aria-hidden>
      <path d="M 22 56 C 22 14, 90 14, 90 52 C 90 80, 55 80, 55 112" fill="none" stroke={V.gold} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={55} cy={148} r={17} fill={V.cyan} />
    </svg>
  );
}

export function Mascot({ width, mood, look = { x: 0.2, y: -0.7 }, className = "" }: { width: number; mood: CrunchyMood; look?: { x: number; y: number }; className?: string }) {
  return (
    <div className={className} style={{ width: u(width) }}>
      <Crunchy size={120} mood={mood} look={look} className="block h-auto w-full" />
    </div>
  );
}
