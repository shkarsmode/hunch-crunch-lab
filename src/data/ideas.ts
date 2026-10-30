export type IdeaStatus = "heard" | "crunching" | "rendering" | "live";

export type Idea = { id: string; title: string; by: string; status: IdeaStatus; video?: string; note?: string; votes?: number };

export const STATUS: Record<IdeaStatus, { label: string; emoji: string; color: string }> = {
  heard: { label: "Heard", emoji: "👂", color: "#A9B6D3" },
  crunching: { label: "Crunching", emoji: "🧮", color: "#3FE0FF" },
  rendering: { label: "Rendering", emoji: "🎬", color: "#FFC94A" },
  live: { label: "Live", emoji: "✅", color: "#3EE6A0" },
};

export const SEED_IDEAS: Idea[] = [
  { id: "seed-web", title: "“Whats this website called?”", by: "@EvilestTwin8831", status: "live", note: "There wasn't one. Now there is: you're on it." },
  { id: "seed-stickers", title: "How many packs to fill a 980-sticker album?", by: "@maximbarishov4120", status: "live", video: "mSCDoaaekP0" },
  { id: "seed-keypad", title: "Which lock is safer: 4 smudged keys or 3?", by: "@АнастасияБабанская-ч2у", status: "live", video: "Gt1BTXobv4w" },
  { id: "seed-bald", title: "How many hairs do you really need to not be called bald?", by: "@Ron4Memez", status: "crunching" },
];
