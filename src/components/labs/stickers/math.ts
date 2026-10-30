import { RARE_WEIGHT, type Config } from "./config";

export type Spec = {
  n: number;
  k: number;
  rareEvery: number;
  nr: number;
  nc: number;
  pRare: number;
  pc: number;
  pr: number;
};

export function makeSpec(c: Config): Spec {
  const rareEvery = c.rareEvery;
  const nr = rareEvery > 0 ? Math.floor(c.n / rareEvery) : 0;
  const nc = c.n - nr;
  const w = nc + nr * RARE_WEIGHT;
  const pc = 1 / w;
  const pr = RARE_WEIGHT / w;
  return { n: c.n, k: c.k, rareEvery, nr, nc, pRare: nr * pr, pc, pr };
}

export function sample(s: Spec, u: number) {
  if (s.nr > 0) {
    if (u < s.pRare) {
      const j = ((u / s.pRare) * s.nr) | 0;
      return j * s.rareEvery + s.rareEvery - 1;
    }
    const c = Math.min(s.nc - 1, (((u - s.pRare) / (1 - s.pRare)) * s.nc) | 0);
    return c + ((c / (s.rareEvery - 1)) | 0);
  }
  return (u * s.n) | 0;
}

export function harmonic(m: number) {
  let h = 0;
  for (let i = 1; i <= m; i++) h += 1 / i;
  return h;
}

function tailIntegral(s: Spec, mc: number, mr: number) {
  const pSlow = mr > 0 ? s.pr : s.pc;
  const tMax = (Math.log(mc + mr + 1) + 40) / pSlow;
  const steps = 6000;
  const h = tMax / steps;
  const f = (t: number) => {
    if (t <= 0) return 1;
    const lc = mc > 0 ? mc * Math.log(-Math.expm1(-s.pc * t)) : 0;
    const lr = mr > 0 ? mr * Math.log(-Math.expm1(-s.pr * t)) : 0;
    return 1 - Math.exp(lc + lr);
  };
  let sum = f(0) + f(tMax);
  for (let i = 1; i < steps; i++) sum += f(i * h) * (i % 2 === 0 ? 2 : 4);
  return (sum * h) / 3;
}

export function remainingDraws(s: Spec, mc: number, mr: number) {
  if (mc + mr === 0) return 0;
  if (mr === 0) return harmonic(mc) / s.pc;
  if (mc === 0) return harmonic(mr) / s.pr;
  return tailIntegral(s, mc, mr);
}

export function remainingPacks(s: Spec, mc: number, mr: number) {
  const m = mc + mr;
  if (m === 0) return 0;
  if (m === 1) {
    const p = mc > 0 ? s.pc : s.pr;
    return 1 / (1 - Math.pow(1 - p, s.k));
  }
  return (remainingDraws(s, mc, mr) + (s.k - 1) / 2) / s.k;
}

export function expectedDraws(s: Spec) {
  return remainingDraws(s, s.nc, s.nr);
}

export function expectedPacks(s: Spec) {
  return remainingPacks(s, s.nc, s.nr);
}

export function easyPacks(s: Spec) {
  return Math.ceil(s.n / s.k);
}

export function expectedFill(s: Spec, packs: number) {
  const draws = packs * s.k;
  const common = s.nc * (1 - Math.pow(1 - s.pc, draws));
  const rare = s.nr * (1 - Math.pow(1 - s.pr, draws));
  return (common + rare) / s.n;
}

export function packChance(s: Spec, rare: boolean) {
  return 1 - Math.pow(1 - (rare ? s.pr : s.pc), s.k);
}

export function mean(values: ArrayLike<number>, count: number) {
  let t = 0;
  for (let i = 0; i < count; i++) t += values[i];
  return count > 0 ? t / count : 0;
}

export function quantile(sorted: ArrayLike<number>, q: number) {
  const n = sorted.length;
  if (n === 0) return 0;
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.min(n - 1, lo + 1);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
