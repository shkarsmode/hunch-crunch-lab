"use client";

import { useCallback, useMemo, useState } from "react";
import { VIDEO_SETUP, type Setup } from "@/components/labs/ants/engine";

export { Icon } from "@/components/ui/icons";
export { AntsThumb, CoinThumb, PackThumb } from "@/components/ui/thumbs";

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
