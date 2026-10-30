import { Group } from "./group";
import { quantile, sample, type Spec } from "./math";
import { Rng } from "./rng";

class Soloist {
  private spec: Spec;
  private rng: Rng;
  private stamp: Uint32Array;
  private gen = 0;

  constructor(spec: Spec, rng: Rng) {
    this.spec = spec;
    this.rng = rng;
    this.stamp = new Uint32Array(spec.n);
  }

  album() {
    const s = this.spec;
    const n = s.n;
    const k = s.k;
    const stamp = this.stamp;
    const rare = s.nr > 0;
    const g = ++this.gen;
    const r = this.rng;
    let a = r.a;
    let b = r.b;
    let c = r.c;
    let d = r.d;
    const scale = n / 4294967296;
    let have = 0;
    let packs = 0;
    if (rare) {
      while (have < n) {
        packs++;
        for (let j = 0; j < k; j++) {
          const t = (((a + b) | 0) + d) | 0;
          d = (d + 1) | 0;
          a = b ^ (b >>> 9);
          b = (c + (c << 3)) | 0;
          c = (c << 21) | (c >>> 11);
          c = (c + t) | 0;
          const id = sample(s, (t >>> 0) / 4294967296);
          if (stamp[id] !== g) {
            stamp[id] = g;
            have++;
          }
        }
      }
    } else {
      while (have < n) {
        packs++;
        for (let j = 0; j < k; j++) {
          const t = (((a + b) | 0) + d) | 0;
          d = (d + 1) | 0;
          a = b ^ (b >>> 9);
          b = (c + (c << 3)) | 0;
          c = (c << 21) | (c >>> 11);
          c = (c + t) | 0;
          const id = ((t >>> 0) * scale) | 0;
          if (stamp[id] !== g) {
            stamp[id] = g;
            have++;
          }
        }
      }
    }
    r.a = a;
    r.b = b;
    r.c = c;
    r.d = d;
    return packs;
  }
}

export interface Sim {
  readonly total: number;
  readonly done: number;
  readonly finished: boolean;
  step(budgetMs: number): void;
}

export class SoloSim implements Sim {
  readonly total: number;
  readonly results: Int32Array;
  done = 0;
  private soloist: Soloist;

  constructor(spec: Spec, total: number) {
    this.total = total;
    this.results = new Int32Array(total);
    this.soloist = new Soloist(spec, Rng.fresh());
  }

  get finished() {
    return this.done >= this.total;
  }

  step(budgetMs: number) {
    const end = performance.now() + budgetMs;
    while (this.done < this.total) {
      this.results[this.done++] = this.soloist.album();
      if ((this.done & 3) === 0 && performance.now() >= end) return;
    }
  }
}

export class SwapSim implements Sim {
  readonly total: number;
  readonly people: number;
  readonly alone: Int32Array;
  readonly swap: Int32Array;
  done = 0;
  private spec: Spec;
  private rng: Rng;
  private soloist: Soloist;
  private group: Group | null = null;

  constructor(spec: Spec, friends: number, groups: number) {
    this.spec = spec;
    this.total = groups;
    this.people = friends + 1;
    this.alone = new Int32Array(groups * this.people);
    this.swap = new Int32Array(groups * this.people);
    this.rng = Rng.fresh();
    this.soloist = new Soloist(spec, this.rng);
  }

  get finished() {
    return this.done >= this.total;
  }

  get samples() {
    return this.done * this.people;
  }

  step(budgetMs: number) {
    const end = performance.now() + budgetMs;
    while (this.done < this.total) {
      if (!this.group) {
        this.group = new Group(this.spec, this.people);
        for (let p = 0; p < this.people; p++) this.alone[this.done * this.people + p] = this.soloist.album();
      }
      const g = this.group;
      let r = 0;
      while (!g.allDone() && g.rounds < 400000) {
        g.round(this.rng, null);
        if ((++r & 15) === 0 && performance.now() >= end) return;
      }
      for (let p = 0; p < this.people; p++) this.swap[this.done * this.people + p] = g.doneAt[p] > 0 ? g.doneAt[p] : g.packs[p];
      this.group = null;
      this.done++;
      if (performance.now() >= end) return;
    }
  }
}

export function drive(sim: Sim, onFrame: () => void, budgetMs = 9) {
  let raf = 0;
  let dead = false;
  const tick = () => {
    if (dead) return;
    sim.step(budgetMs);
    onFrame();
    if (!sim.finished) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    dead = true;
    cancelAnimationFrame(raf);
  };
}

export type Summary = { count: number; mean: number; median: number; p10: number; p90: number; min: number; max: number };

export function summarize(values: Int32Array, count: number): Summary {
  const sorted = values.slice(0, count).sort();
  let total = 0;
  for (let i = 0; i < count; i++) total += sorted[i];
  return {
    count,
    mean: count > 0 ? total / count : 0,
    median: quantile(sorted, 0.5),
    p10: quantile(sorted, 0.1),
    p90: quantile(sorted, 0.9),
    min: count > 0 ? sorted[0] : 0,
    max: count > 0 ? sorted[count - 1] : 0,
  };
}

export function beatenShare(values: Int32Array, count: number, mine: number) {
  let worse = 0;
  for (let i = 0; i < count; i++) if (values[i] > mine) worse++;
  return count > 0 ? worse / count : 0;
}

export type Axis = { lo: number; step: number; bins: number };

const STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1500, 2000, 5000];

function pickStep(raw: number) {
  for (const v of STEPS) if (v >= raw) return v;
  return Math.ceil(raw);
}

export function makeAxis(sets: { values: Int32Array; count: number }[], maxBins: number, pad = 0): Axis {
  let total = 0;
  for (const set of sets) total += set.count;
  const all = new Int32Array(total);
  let at = 0;
  for (const set of sets) {
    all.set(set.values.subarray(0, set.count), at);
    at += set.count;
  }
  all.sort();
  const q0 = quantile(all, 0.001);
  const q1 = quantile(all, 0.999);
  const lo = q0 - (q1 - q0) * pad * 0.3;
  const hi = q1 + (q1 - q0) * pad;
  const step = pickStep((hi - lo) / maxBins);
  const start = Math.max(0, Math.floor(lo / step) * step);
  const bins = Math.max(8, Math.min(maxBins, Math.ceil((hi - start) / step) + 1));
  return { lo: start, step, bins };
}

export function binCounts(values: Int32Array, count: number, axis: Axis) {
  const out = new Array<number>(axis.bins).fill(0);
  for (let i = 0; i < count; i++) {
    let b = Math.floor((values[i] - axis.lo) / axis.step);
    if (b < 0) b = 0;
    else if (b >= axis.bins) b = axis.bins - 1;
    out[b]++;
  }
  return out;
}
