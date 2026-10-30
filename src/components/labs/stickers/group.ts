import type { Rng } from "./rng";
import { sample, type Spec } from "./math";

export type Draw = { id: number; fresh: boolean };

export type Swap = { id: number; friend: number; dir: "in" | "out"; gift: boolean };

export type Recorder = { draws: Draw[]; swaps: Swap[] };

function pop(v: number) {
  v = v - ((v >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return Math.imul((v + (v >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}

export class Group {
  readonly spec: Spec;
  readonly people: number;
  readonly words: number;
  readonly counts: Uint16Array;
  readonly need: Uint32Array;
  readonly spare: Uint32Array;
  readonly owned: Int32Array;
  readonly packs: Int32Array;
  readonly doneAt: Int32Array;
  private pairs: Int32Array;
  private bufA: Int32Array;
  private bufB: Int32Array;
  rounds = 0;

  constructor(spec: Spec, people: number) {
    this.spec = spec;
    this.people = people;
    this.words = (spec.n + 31) >>> 5;
    this.counts = new Uint16Array(people * spec.n);
    this.need = new Uint32Array(people * this.words);
    this.spare = new Uint32Array(people * this.words);
    this.owned = new Int32Array(people);
    this.packs = new Int32Array(people);
    this.doneAt = new Int32Array(people).fill(-1);
    this.bufA = new Int32Array(spec.n);
    this.bufB = new Int32Array(spec.n);
    const list: number[] = [];
    for (let a = 0; a < people; a++) for (let b = a + 1; b < people; b++) list.push(a * 16 + b);
    this.pairs = Int32Array.from(list);
    const last = spec.n & 31;
    for (let p = 0; p < people; p++) {
      for (let w = 0; w < this.words; w++) {
        const full = w < this.words - 1 || last === 0;
        this.need[p * this.words + w] = full ? 0xffffffff : (1 << last) - 1;
      }
    }
  }

  finished(p: number) {
    return this.owned[p] === this.spec.n;
  }

  allDone() {
    for (let p = 0; p < this.people; p++) if (this.doneAt[p] < 0) return false;
    return true;
  }

  private openPack(p: number, rng: Rng, out: Draw[] | null) {
    const { spec, counts, need, spare, words, owned } = this;
    const base = p * spec.n;
    const wb = p * words;
    for (let j = 0; j < spec.k; j++) {
      const id = sample(spec, rng.next());
      const c = counts[base + id];
      counts[base + id] = c + 1;
      if (c === 0) {
        need[wb + (id >>> 5)] &= ~(1 << (id & 31));
        owned[p]++;
      } else if (c === 1) {
        spare[wb + (id >>> 5)] |= 1 << (id & 31);
      }
      if (out) out.push({ id, fresh: c === 0 });
    }
    this.packs[p]++;
  }

  private move(from: number, to: number, id: number) {
    const n = this.spec.n;
    const w = this.words;
    const fi = from * n + id;
    const ti = to * n + id;
    const fc = this.counts[fi] - 1;
    this.counts[fi] = fc;
    if (fc === 1) this.spare[from * w + (id >>> 5)] &= ~(1 << (id & 31));
    const tc = this.counts[ti];
    this.counts[ti] = tc + 1;
    if (tc === 0) {
      this.need[to * w + (id >>> 5)] &= ~(1 << (id & 31));
      this.owned[to]++;
    } else if (tc === 1) {
      this.spare[to * w + (id >>> 5)] |= 1 << (id & 31);
    }
  }

  private gather(a: number, b: number, buf: Int32Array, limit: number, start: number) {
    const W = this.words;
    const wa = a * W;
    const wb = b * W;
    let got = 0;
    for (let s = 0; s < W && got < limit; s++) {
      const w = (s + start) % W;
      let bits = this.spare[wa + w] & this.need[wb + w];
      while (bits !== 0 && got < limit) {
        const low = bits & -bits;
        buf[got++] = w * 32 + 31 - Math.clz32(low);
        bits ^= low;
      }
    }
    return got;
  }

  private swapPair(a: number, b: number, rng: Rng, rec: Recorder | null) {
    const W = this.words;
    const wa = a * W;
    const wb = b * W;
    let x = 0;
    let y = 0;
    for (let w = 0; w < W; w++) {
      x += pop(this.spare[wa + w] & this.need[wb + w]);
      y += pop(this.spare[wb + w] & this.need[wa + w]);
    }
    const m = x < y ? x : y;
    if (m === 0) return;
    const na = this.gather(a, b, this.bufA, m, rng.int(W));
    const nb = this.gather(b, a, this.bufB, m, rng.int(W));
    for (let i = 0; i < m && i < na && i < nb; i++) {
      const ia = this.bufA[i];
      const ib = this.bufB[i];
      this.move(a, b, ia);
      this.move(b, a, ib);
      if (rec && a === 0) {
        rec.swaps.push({ id: ia, friend: b - 1, dir: "out", gift: false });
        rec.swaps.push({ id: ib, friend: b - 1, dir: "in", gift: false });
      }
    }
  }

  private gift(f: number, p: number, rec: Recorder | null) {
    const W = this.words;
    for (let w = 0; w < W; w++) {
      let bits = this.spare[f * W + w] & this.need[p * W + w];
      while (bits !== 0) {
        const low = bits & -bits;
        const id = w * 32 + 31 - Math.clz32(low);
        this.move(f, p, id);
        if (rec && p === 0) rec.swaps.push({ id, friend: f - 1, dir: "in", gift: true });
        bits = this.spare[f * W + w] & this.need[p * W + w];
      }
    }
  }

  private trade(rng: Rng, rec: Recorder | null) {
    const list = this.pairs;
    for (let i = list.length - 1; i > 0; i--) {
      const j = rng.int(i + 1);
      const t = list[i];
      list[i] = list[j];
      list[j] = t;
    }
    for (let i = 0; i < list.length; i++) {
      const a = list[i] >> 4;
      const b = list[i] & 15;
      if (this.finished(a) || this.finished(b)) continue;
      this.swapPair(a, b, rng, rec);
    }
    for (let f = 0; f < this.people; f++) {
      if (!this.finished(f)) continue;
      for (let p = 0; p < this.people; p++) {
        if (p !== f && !this.finished(p)) this.gift(f, p, rec);
      }
    }
  }

  round(rng: Rng, rec: Recorder | null) {
    for (let p = 0; p < this.people; p++) {
      if (this.doneAt[p] < 0) this.openPack(p, rng, p === 0 ? (rec ? rec.draws : null) : null);
    }
    if (this.people > 1) this.trade(rng, rec);
    this.rounds++;
    for (let p = 0; p < this.people; p++) {
      if (this.doneAt[p] < 0 && this.finished(p)) this.doneAt[p] = this.packs[p];
    }
  }
}
