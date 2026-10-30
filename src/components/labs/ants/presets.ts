import { VIDEO_SETUP, type Setup } from "./engine";

export type Preset = { id: string; name: string; line: string; setup: Setup; free?: boolean };

const two = (dx: number, dy: number, d: number, rule = "RL"): Setup => ({
  ants: [
    { x: 0, y: 0, d: 0, rule, color: 0 },
    { x: dx, y: dy, d, rule, color: 1 },
  ],
  wrap: false,
});

const one = (rule: string): Setup => ({ ants: [{ x: 0, y: 0, d: 0, rule, color: 0 }], wrap: false });

export const PRESETS: Preset[] = [
  { id: "video", name: "The video", line: "15 left, 5 up, facing right. Home at step 84,876.", setup: VIDEO_SETUP, free: true },
  { id: "blink", name: "Blink", line: "Side by side. Home in 16 steps.", setup: two(-1, 0, 2) },
  { id: "head-on", name: "Head-on", line: "10 apart, face to face. Home at step 2,016.", setup: two(10, 0, 3) },
  { id: "tall", name: "Tall twins", line: "12 squares apart. Home at step 51,272.", setup: two(-1, 12, 2) },
  { id: "big-loop", name: "Big loop", line: "15 right, 4 down. Home at step 88,648.", setup: two(15, 4, 2) },
  {
    id: "four",
    name: "Four ants",
    line: "One rule, four ants. Do they ever come home?",
    setup: {
      ants: [
        { x: -6, y: -6, d: 1, rule: "RL", color: 0 },
        { x: 6, y: -6, d: 2, rule: "RL", color: 1 },
        { x: 6, y: 6, d: 3, rule: "RL", color: 2 },
        { x: -6, y: 6, d: 0, rule: "RL", color: 3 },
      ],
      wrap: false,
    },
  },
  { id: "langton", name: "Langton's ant", line: "RL. Chaos, then a highway after about 10,000 steps.", setup: one("RL") },
  { id: "mirror", name: "Mirror", line: "LLRR. Grows symmetric, forever.", setup: one("LLRR") },
  { id: "chaos", name: "Chaos", line: "RLR. Never settles down.", setup: one("RLR") },
  { id: "square", name: "Square", line: "LRRRRRLLR. Fills a growing square.", setup: one("LRRRRRLLR") },
  { id: "twisted", name: "Twisted highway", line: "LLRRRLRLRLLR. Wild, then a highway.", setup: one("LLRRRLRLRLLR") },
  { id: "triangle", name: "Triangle", line: "RRLLLRLLLRRR. A filled triangle on the move.", setup: one("RRLLLRLLLRRR") },
];

export const RULE_CHIPS = ["RL", "LLRR", "RLR", "LRRRRRLLR", "LLRRRLRLRLLR", "RRLLLRLLLRRR"];
