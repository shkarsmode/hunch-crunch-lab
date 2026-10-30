export const VIDEO_ID = "mSCDoaaekP0";

export const RARE_WEIGHT = 0.2;

export type RareEvery = 0 | 10 | 5;

export type Config = {
  n: number;
  k: number;
  rareEvery: RareEvery;
  friends: number;
};

export const FREE_CONFIG: Config = { n: 50, k: 5, rareEvery: 0, friends: 0 };

export const LIMITS = { nMin: 20, nMax: 980, nStep: 10, kMin: 1, kMax: 12, friendsMax: 5 };

export const ALBUM_PRESETS = [50, 100, 250, 500, 980];

export const VIDEO = {
  n: 980,
  k: 7,
  price: 2,
  easyPacks: 140,
  easyCost: 280,
  meanPacks: 1046,
  medianPacks: 1018,
  collectors: 10000,
};

export const PALETTE = ["#3FE0FF", "#FF5C7A", "#3EE6A0", "#B48CFF", "#FF9F43", "#F4F6FB", "#4D8BFF", "#FF7AD9"];

export const FRIEND_FACES = ["🦊", "🐼", "🐸", "🦄", "🐙"];

export function colorOf(id: number) {
  return Math.imul(id + 1, 2654435761) >>> 29;
}

export function isRare(rareEvery: number, id: number) {
  return rareEvery > 0 && (id + 1) % rareEvery === 0;
}

export function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function sanitize(c: Config): Config {
  const n = clamp(Math.round(c.n / LIMITS.nStep) * LIMITS.nStep, LIMITS.nMin, LIMITS.nMax);
  const k = clamp(Math.round(c.k), LIMITS.kMin, LIMITS.kMax);
  const rareEvery: RareEvery = c.rareEvery === 10 || c.rareEvery === 5 ? c.rareEvery : 0;
  const friends = clamp(Math.round(c.friends), 0, LIMITS.friendsMax);
  return { n, k, rareEvery, friends };
}

export function sameConfig(a: Config, b: Config) {
  return a.n === b.n && a.k === b.k && a.rareEvery === b.rareEvery && a.friends === b.friends;
}

export function tap() {
  try {
    navigator.vibrate?.(8);
  } catch {}
}

export const fmt = (v: number) => v.toLocaleString("en-US");

export function fmtPacks(v: number) {
  if (v >= 1000) return fmt(Math.round(v));
  if (v >= 100) return v.toFixed(0);
  return v.toFixed(1);
}
