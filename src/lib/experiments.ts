export type Accent = "gold" | "cyan" | "coral" | "mint";

export type Experiment = {
  slug: string;
  title: string;
  hook: string;
  status: "live" | "soon";
  video?: string;
  accent: Accent;
  emoji: string;
  free?: string;
  full?: string[];
};

export const EXPERIMENTS: Experiment[] = [
  {
    slug: "two-ants",
    title: "Two ants, same 2 rules",
    hook: "They make a mess, build highways, then undo every square. Watch step 84,876.",
    status: "live",
    video: "qKFPDHmAR4Q",
    accent: "gold",
    emoji: "🐜",
    free: "The exact setup from the video",
    full: ["Up to 6 ants", "Any rule string, 12 presets", "Positions, distance, directions", "Speed up to 1M steps/s", "Find setups that come home", "Share links"],
  },
  {
    slug: "coin",
    title: "Real coin or fake?",
    hook: "Tap 20 flips like a coin would. Can you fool 10,000 real coins?",
    status: "live",
    video: "ohw7yj6AZ_E",
    accent: "cyan",
    emoji: "🪙",
    free: "One 20-flip round",
    full: ["Any number of flips", "Run and switch charts", "Detector settings", "Endless rounds and streaks"],
  },
  {
    slug: "stickers",
    title: "Fill the sticker album",
    hook: "How many packs does it really take? Rip them open and find out.",
    status: "live",
    video: "mSCDoaaekP0",
    accent: "mint",
    emoji: "📒",
    free: "A 50-sticker album",
    full: ["Albums up to 980 stickers", "Pack size and rare stickers", "Swap duplicates with friends", "10,000-album simulator"],
  },
  { slug: "marble-race", title: "Marble race", hook: "Pick a colour. Watch 1,000 replays.", status: "soon", video: "Sn-VP6HuxUo", accent: "coral", emoji: "🏁" },
  { slug: "boarding-pass", title: "Lost boarding pass", hook: "Will the last passenger get their seat?", status: "soon", video: "OnLO6swObB8", accent: "cyan", emoji: "✈️" },
  { slug: "soft", title: "0% vs 100% soft", hook: "Which ones squeeze in?", status: "soon", video: "IAsdcIZwRTY", accent: "gold", emoji: "🫠" },
  { slug: "tic-tac-toe", title: "Random tic-tac-toe", hook: "Who wins more when nobody thinks?", status: "soon", video: "9SZmxX8YdSc", accent: "mint", emoji: "❌" },
  { slug: "keypad", title: "Smudged keypad", hook: "4 smudged keys or 3: which lock is safer?", status: "soon", video: "Gt1BTXobv4w", accent: "coral", emoji: "🔢" },
];

export const ACCENT_HEX: Record<Accent, string> = {
  gold: "#FFC94A",
  cyan: "#3FE0FF",
  coral: "#FF5C7A",
  mint: "#3EE6A0",
};
