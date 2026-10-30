import type { Config } from "./config";
import { Group, type Draw, type Swap } from "./group";
import { makeSpec, type Spec } from "./math";
import { Rng } from "./rng";

export type PackResult = { pack: number; draws: Draw[]; swaps: Swap[]; done: boolean };

export class Game {
  readonly config: Config;
  readonly spec: Spec;
  private group: Group;
  private rng: Rng | null = null;

  constructor(config: Config) {
    this.config = config;
    this.spec = makeSpec(config);
    this.group = new Group(this.spec, config.friends + 1);
  }

  get packs() {
    return this.group.packs[0];
  }

  get owned() {
    return this.group.owned[0];
  }

  get done() {
    return this.group.finished(0);
  }

  copies() {
    let total = 0;
    for (let i = 0; i < this.spec.n; i++) total += this.group.counts[i];
    return total;
  }

  count(id: number) {
    return this.group.counts[id];
  }

  counts() {
    return this.group.counts.subarray(0, this.spec.n);
  }

  friendShares() {
    const out: number[] = [];
    for (let p = 1; p < this.group.people; p++) out.push(this.group.owned[p] / this.spec.n);
    return out;
  }

  missing() {
    let mc = 0;
    let mr = 0;
    const r = this.spec.rareEvery;
    for (let i = 0; i < this.spec.n; i++) {
      if (this.group.counts[i] > 0) continue;
      if (r > 0 && (i + 1) % r === 0) mr++;
      else mc++;
    }
    return { mc, mr };
  }

  rip(count: number) {
    if (!this.rng) this.rng = Rng.fresh();
    const out: PackResult[] = [];
    for (let i = 0; i < count && !this.done; i++) {
      const rec = { draws: [] as Draw[], swaps: [] as Swap[] };
      this.group.round(this.rng, rec);
      out.push({ pack: this.group.packs[0], draws: rec.draws, swaps: rec.swaps, done: this.done });
    }
    return out;
  }
}
