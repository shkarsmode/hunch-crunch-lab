"use client";

import { useCallback, useMemo, useState, type SVGProps } from "react";
import { VIDEO_SETUP, type Setup } from "@/components/labs/ants/engine";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {children}
    </svg>
  );
}

export const Icon = {
  Play: (p: IconProps) => (
    <Svg {...p}>
      <path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.2-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6Z" fill="currentColor" stroke="none" />
    </Svg>
  ),
  Pause: (p: IconProps) => (
    <Svg {...p}>
      <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none" />
    </Svg>
  ),
  Step: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6 6.5v11l8-5.5-8-5.5Z" fill="currentColor" stroke="none" />
      <path d="M17.5 6v12" />
    </Svg>
  ),
  Reset: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4" />
      <path d="M4.5 4.5v4h4" />
    </Svg>
  ),
  Lock: (p: IconProps) => (
    <Svg {...p}>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.4" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Svg>
  ),
  Chevron: (p: IconProps) => (
    <Svg {...p}>
      <path d="m9.5 6 6 6-6 6" />
    </Svg>
  ),
  Arrow: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  ),
  Out: (p: IconProps) => (
    <Svg {...p}>
      <path d="M8 16 16.5 7.5M9.5 7.5h7v7" />
    </Svg>
  ),
  Check: (p: IconProps) => (
    <Svg {...p}>
      <path d="m5.5 12.5 4 4 9-9.5" />
    </Svg>
  ),
  Plus: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Svg>
  ),
  Minus: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5.5 12h13" />
    </Svg>
  ),
  Menu: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4.5 8.5h15M4.5 15.5h15" />
    </Svg>
  ),
  Spark: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 3.5c.6 4.3 2.4 6.3 6.5 7-4.1.8-5.9 2.8-6.5 7-.6-4.2-2.4-6.2-6.5-7 4.1-.7 5.9-2.7 6.5-7Z" fill="currentColor" stroke="none" />
    </Svg>
  ),
  Youtube: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="6" width="18" height="12.5" rx="4" />
      <path d="m10.5 9.7 4.3 2.55-4.3 2.55Z" fill="currentColor" stroke="none" />
    </Svg>
  ),
};

/* Live step counter fed by the real ants preview. */
export function useAntsStep() {
  const [step, setStep] = useState(0);
  const [home, setHome] = useState(false);
  const onStep = useCallback((s: number, h: boolean) => {
    setStep(s);
    setHome(h);
  }, []);
  return { step, home, onStep };
}

export const fmt = (n: number) => n.toLocaleString("en-US");

/* A small real Langton pattern: two RL ants taking turns, like the video. */
type Cell = { x: number; y: number; o: number };
const PATTERN: Cell[] = (() => {
  const N = 26;
  const grid = new Map<number, number>();
  const ants = [
    { x: 13, y: 15, d: 0 },
    { x: 8, y: 11, d: 1 },
  ];
  const D = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  for (let k = 0; k < 900; k++) {
    const a = ants[k % 2];
    const key = a.y * N + a.x;
    const on = grid.has(key);
    a.d = (a.d + (on ? 3 : 1)) % 4;
    if (on) grid.delete(key);
    else grid.set(key, k % 2);
    a.x = (a.x + D[a.d][0] + N) % N;
    a.y = (a.y + D[a.d][1] + N) % N;
  }
  return [...grid.entries()].map(([key, o]) => ({ x: key % N, y: Math.floor(key / N), o }));
})();

const BOX = (() => {
  const xs = PATTERN.map((c) => c.x);
  const ys = PATTERN.map((c) => c.y);
  const x0 = Math.min(...xs) - 1;
  const y0 = Math.min(...ys) - 1;
  const side = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0) + 2;
  return { x0, y0, side };
})();

export function AntsThumb({ className = "", cell = 2.6, colors = ["#3FD2FF", "#FF4FD8"] }: { className?: string; cell?: number; colors?: [string, string] | string[] }) {
  const { x0, y0, side } = BOX;
  return (
    <svg viewBox={`${x0 * cell} ${y0 * cell} ${side * cell} ${side * cell}`} className={className} aria-hidden>
      {PATTERN.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x * cell + 0.25} y={c.y * cell + 0.25} width={cell - 0.5} height={cell - 0.5} rx={cell * 0.22} fill={colors[c.o]} opacity={0.92} />
      ))}
    </svg>
  );
}

export function CoinThumb({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`coin3d ${className}`} style={{ width: size, height: size }} aria-hidden>
      <div className="coin3d-spin">
        <div className="coin3d-face coin3d-h" style={{ fontSize: size * 0.42 }}>
          H
        </div>
        <div className="coin3d-face coin3d-t" style={{ fontSize: size * 0.42 }}>
          T
        </div>
      </div>
    </div>
  );
}

const STICKERS = [
  { n: 17, c: "#FF5C7A" },
  { n: 42, c: "#3FE0FF" },
  { n: 3, c: "#FFC94A" },
];

export function PackThumb({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }} aria-hidden>
      {STICKERS.map((s, i) => (
        <div
          key={s.n}
          className="sticker-card absolute inset-[14%] grid place-items-center rounded-[22%] font-black text-[#0B1020]"
          style={{
            background: `linear-gradient(160deg, #ffffff 0%, ${s.c} 75%)`,
            transform: `rotate(${(i - 1) * 14}deg) translateX(${(i - 1) * 9}%)`,
            fontSize: size * 0.22,
            animationDelay: `${i * 0.25}s`,
            zIndex: i === 1 ? 2 : 1,
            boxShadow: "0 6px 14px -6px rgba(0,0,0,.6)",
          }}
        >
          #{s.n}
        </div>
      ))}
    </div>
  );
}

export const LAB = [
  {
    slug: "two-ants",
    title: "Two ants, same 2 rules",
    hook: "They make a mess, build highways, then undo every square.",
    fact: "84,876",
    factLine: "steps to wipe the grid clean",
    accent: "#3FD2FF",
    accent2: "#FF4FD8",
    free: "The exact setup from the video",
    unlocks: 6,
  },
  {
    slug: "coin",
    title: "Real coin or fake?",
    hook: "Tap 20 flips like a coin would. Can you fool 10,000 real ones?",
    fact: "10,000",
    factLine: "real coins to beat",
    accent: "#FFC94A",
    accent2: "#FFE7A3",
    free: "One 20-flip round",
    unlocks: 4,
  },
  {
    slug: "stickers",
    title: "Fill the sticker album",
    hook: "How many packs does it really take? More than your gut says.",
    fact: "$2,000",
    factLine: "not $280, to finish it",
    accent: "#FF5C7A",
    accent2: "#FFB3C2",
    free: "The album from the video",
    unlocks: 5,
  },
] as const;

export const PRESETS = [
  { name: "Video", locked: false },
  { name: "Blink", locked: true },
  { name: "Head-on", locked: true },
  { name: "Tall", locked: true },
  { name: "Big loop", locked: true },
  { name: "Highway", locked: true },
];

export const SPEEDS: { label: string; rate: number | null }[] = [
  { label: "Auto", rate: null },
  { label: "10", rate: 10 },
  { label: "100", rate: 100 },
  { label: "1K", rate: 1000 },
  { label: "10K", rate: 10000 },
];

/* Real controls for the preview: play, speed, single step, reset, and each ant's two rule letters. */
export function useAntsControls() {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0);
  const [rules, setRules] = useState(["RL", "RL"]);
  const [nudge, setNudge] = useState(0);
  const [reset, setReset] = useState(0);
  const [hint, setHint] = useState("");
  const setup = useMemo<Setup>(() => ({ ...VIDEO_SETUP, ants: VIDEO_SETUP.ants.map((a, i) => ({ ...a, rule: rules[i] })) }), [rules]);
  return {
    playing,
    toggle: () => setPlaying((p) => !p),
    speed,
    setSpeed,
    rules,
    flip: (ant: number, pos: number) =>
      setRules((r) => r.map((s, i) => (i !== ant ? s : s.slice(0, pos) + (s[pos] === "R" ? "L" : "R") + s.slice(pos + 1)))),
    step: () => {
      setPlaying(false);
      setNudge((n) => n + 1);
    },
    restart: () => {
      setRules(["RL", "RL"]);
      setReset((n) => n + 1);
      setPlaying(true);
    },
    hint,
    locked: (what: string) => {
      setHint(`${what} are in the full lab`);
      window.setTimeout(() => setHint(""), 1800);
    },
    preview: { setup, rate: SPEEDS[speed].rate, paused: !playing, nudge, reset },
  };
}

export const UNLOCKS = ["Up to 6 ants, any rules", "Speeds up to 1M steps a second", "Every game, every setting", "Your badge on the supporter wall"];

export type Rule = "R" | "L";
