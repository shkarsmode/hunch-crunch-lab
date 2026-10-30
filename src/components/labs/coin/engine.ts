export const COINS = 10000;
export const FLIP_COUNTS = [20, 50, 100, 200] as const;

export type FlipCount = (typeof FLIP_COUNTS)[number];
export type Side = "H" | "T";
export type Level = "relaxed" | "standard" | "strict";
export type Metric = "switches" | "run";
export type Dir = "high" | "low";
export type Tone = "smooth" | "streaky" | "short" | "long" | "clean" | "close";

export type LevelInfo = { id: Level; label: string; alpha: number; blurb: string };

export const LEVELS: readonly LevelInfo[] = [
  { id: "relaxed", label: "Relaxed", alpha: 0.02, blurb: "Flags you only if your switches or longest streak are rarer than 2 in 100 real coins." },
  { id: "standard", label: "Standard", alpha: 0.1, blurb: "Flags you if your switches or longest streak are rarer than 10 in 100 real coins." },
  { id: "strict", label: "Strict", alpha: 0.25, blurb: "Flags you if either one is rarer than 25 in 100 real coins. Plenty of real coins get flagged too." },
];

export const FREE = { n: 20, level: "standard" } as const;

export function levelInfo(level: Level): LevelInfo {
  return LEVELS.find((l) => l.id === level) ?? LEVELS[1];
}

export type Next = () => number;

function sfc32(a: number, b: number, c: number, d: number): Next {
  return () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return t >>> 0;
  };
}

export function makeRandom(): Next {
  const seed = new Uint32Array(4);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(seed);
  } else {
    for (let i = 0; i < 4; i++) seed[i] = Math.floor(Math.random() * 4294967296);
  }
  const next = sfc32(seed[0], seed[1], seed[2], seed[3]);
  for (let i = 0; i < 24; i++) next();
  return next;
}

function fillSim(switches: Uint8Array, runs: Uint8Array, from: number, to: number, n: number, next: Next) {
  for (let c = from; c < to; c++) {
    let word = 0;
    let left = 0;
    let prev = 0;
    let run = 0;
    let best = 0;
    let sw = 0;
    for (let i = 0; i < n; i++) {
      if (left === 0) {
        word = next();
        left = 32;
      }
      const bit = word & 1;
      word >>>= 1;
      left--;
      if (i > 0 && bit !== prev) {
        sw++;
        run = 1;
      } else {
        run++;
      }
      if (run > best) best = run;
      prev = bit;
    }
    switches[c] = sw;
    runs[c] = best;
  }
}

export function simulate(n: number, next: Next, coins: number = COINS) {
  const switches = new Uint8Array(coins);
  const runs = new Uint8Array(coins);
  fillSim(switches, runs, 0, coins, n, next);
  return { switches, runs };
}

export function randomSeq(n: number, next: Next): string {
  let out = "";
  let word = 0;
  let left = 0;
  for (let i = 0; i < n; i++) {
    if (left === 0) {
      word = next();
      left = 32;
    }
    out += word & 1 ? "H" : "T";
    word >>>= 1;
    left--;
  }
  return out;
}

export function seqStats(seq: string) {
  let switches = 0;
  let run = 0;
  let best = 0;
  let start = 0;
  let from = 0;
  for (let i = 0; i < seq.length; i++) {
    if (i > 0 && seq.charCodeAt(i) !== seq.charCodeAt(i - 1)) {
      switches++;
      run = 1;
      from = i;
    } else {
      run++;
    }
    if (run > best) {
      best = run;
      start = from;
    }
  }
  return { switches, run: best, start };
}

export function trailingRun(seq: string): number {
  if (!seq) return 0;
  let k = 1;
  while (k < seq.length && seq[seq.length - 1 - k] === seq[seq.length - 1]) k++;
  return k;
}

export type Dist = {
  metric: Metric;
  alpha: number;
  values: Uint8Array;
  counts: Uint32Array;
  upTo: Uint32Array;
  flagged: Uint8Array;
  mean: number;
  p5: number;
  p95: number;
};

export function buildDist(metric: Metric, values: Uint8Array, n: number, alpha: number): Dist {
  const size = n + 1;
  const total = values.length;
  const counts = new Uint32Array(size);
  for (let i = 0; i < total; i++) counts[values[i]]++;
  const upTo = new Uint32Array(size);
  let acc = 0;
  let sum = 0;
  for (let v = 0; v < size; v++) {
    acc += counts[v];
    upTo[v] = acc;
    sum += v * counts[v];
  }
  const flagged = new Uint8Array(size);
  for (let v = 0; v < size; v++) {
    const below = v > 0 ? upTo[v - 1] : 0;
    const tail = Math.min(upTo[v], total - below);
    flagged[v] = (2 * tail) / total < alpha ? 1 : 0;
  }
  const quantile = (f: number) => {
    let v = 0;
    while (v < size - 1 && upTo[v] < f * total) v++;
    return v;
  };
  return { metric, alpha, values, counts, upTo, flagged, mean: sum / total, p5: quantile(0.05), p95: quantile(0.95) };
}

export type Tell = {
  metric: Metric;
  value: number;
  odd: number;
  dir: Dir;
  atLeast: number;
  atMost: number;
  pct: number;
  flagged: boolean;
};

export function tellFor(dist: Dist, value: number): Tell {
  const total = dist.values.length;
  const v = Math.min(Math.max(value, 0), dist.counts.length - 1);
  const atMost = dist.upTo[v];
  const below = v > 0 ? dist.upTo[v - 1] : 0;
  const atLeast = total - below;
  const odd = Math.min(1, (2 * Math.min(atMost, atLeast)) / total);
  return {
    metric: dist.metric,
    value,
    odd,
    dir: atMost < atLeast ? "low" : "high",
    atLeast,
    atMost,
    pct: ((below + dist.counts[v] / 2) / total) * 100,
    flagged: odd < dist.alpha,
  };
}

export type Judged = {
  seq: string;
  sw: Tell;
  ru: Tell;
  lead: Tell;
  also: Tell | null;
  caught: boolean;
  tone: Tone;
  runStart: number;
};

export function judge(seq: string, sw: Dist, ru: Dist): Judged {
  const st = seqStats(seq);
  const swTell = tellFor(sw, st.switches);
  const ruTell = tellFor(ru, st.run);
  const lead = swTell.flagged ? swTell : ruTell.flagged ? ruTell : ruTell.odd < swTell.odd ? ruTell : swTell;
  const other = lead === swTell ? ruTell : swTell;
  const caught = lead.flagged;
  let tone: Tone;
  if (caught) {
    if (lead.metric === "switches") tone = lead.dir === "high" ? "smooth" : "streaky";
    else tone = lead.dir === "low" ? "short" : "long";
  } else {
    tone = lead.odd < sw.alpha * 3 ? "close" : "clean";
  }
  return { seq, sw: swTell, ru: ruTell, lead, also: caught && other.flagged ? other : null, caught, tone, runStart: st.start };
}

export type Analysis = {
  n: number;
  level: Level;
  alpha: number;
  sw: Dist;
  ru: Dist;
  you: Judged;
  falseAlarm: number;
  runAvg: number;
};

export function analyze(seq: string, n: number, level: Level, next: Next = makeRandom()): Analysis {
  return assemble(seq, n, level, simulate(n, next));
}

export async function analyzeAsync(seq: string, n: number, level: Level, next: Next = makeRandom()): Promise<Analysis> {
  const switches = new Uint8Array(COINS);
  const runs = new Uint8Array(COINS);
  const chunk = 2500;
  for (let from = 0; from < COINS; from += chunk) {
    fillSim(switches, runs, from, Math.min(COINS, from + chunk), n, next);
    if (from + chunk < COINS) await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  return assemble(seq, n, level, { switches, runs });
}

function assemble(seq: string, n: number, level: Level, sim: { switches: Uint8Array; runs: Uint8Array }): Analysis {
  const alpha = levelInfo(level).alpha;
  const sw = buildDist("switches", sim.switches, n, alpha);
  const ru = buildDist("run", sim.runs, n, alpha);
  let hits = 0;
  for (let c = 0; c < COINS; c++) if (sw.flagged[sim.switches[c]] || ru.flagged[sim.runs[c]]) hits++;
  return { n, level, alpha, sw, ru, you: judge(seq, sw, ru), falseAlarm: hits / COINS, runAvg: expectedRun(n) };
}

export function realCoin(a: Analysis, next: Next = makeRandom()): Judged {
  return judge(randomSeq(a.n, next), a.sw, a.ru);
}

export type Domain = { lo: number; hi: number };

export function domainFor(dist: Dist, marks: readonly number[]): Domain {
  const top = dist.metric === "switches" ? dist.counts.length - 2 : dist.counts.length - 1;
  let minV = 0;
  while (minV < top && dist.counts[minV] === 0) minV++;
  let maxV = top;
  while (maxV > 0 && dist.counts[maxV] === 0) maxV--;
  const floor = dist.metric === "run" ? 1 : 0;
  let lo = Math.max(floor, minV - 1);
  let hi = Math.min(top, maxV + 1);
  const room = Math.max(6, Math.round((maxV - minV) * 0.7));
  const cap = 84;
  for (const m of marks) {
    if (m < lo && lo - m <= room && hi - m + 1 <= cap) lo = Math.max(floor, m - 1);
    if (m > hi && m - hi <= room && m - lo + 1 <= cap) hi = Math.min(top, m + 1);
  }
  return { lo, hi };
}

function binomialPmf(m: number): Float64Array {
  const pmf = new Float64Array(m + 1);
  pmf[0] = Math.pow(2, -m);
  for (let j = 0; j < m; j++) pmf[j + 1] = (pmf[j] * (m - j)) / (j + 1);
  return pmf;
}

function runWalk(n: number, r: number) {
  if (r <= 1) return { survive: 0, hit: 1 };
  let p = new Float64Array(r);
  let q = new Float64Array(r);
  p[1] = 1;
  let hit = 0;
  for (let i = 2; i <= n; i++) {
    let tot = 0;
    for (let k = 1; k < r; k++) tot += p[k];
    q[1] = 0.5 * tot;
    for (let k = 2; k < r; k++) q[k] = 0.5 * p[k - 1];
    hit += 0.5 * p[r - 1];
    const t = p;
    p = q;
    q = t;
  }
  let survive = 0;
  for (let k = 1; k < r; k++) survive += p[k];
  return { survive, hit };
}

export function expectedRun(n: number): number {
  let sum = 1;
  for (let r = 2; r <= n; r++) {
    const h = runWalk(n, r).hit;
    sum += h;
    if (h < 1e-12) break;
  }
  return sum;
}

export function exactTail(n: number, metric: Metric, value: number, dir: Dir): number {
  if (metric === "switches") {
    const pmf = binomialPmf(n - 1);
    let s = 0;
    if (dir === "high") for (let j = Math.max(0, value); j <= n - 1; j++) s += pmf[j];
    else for (let j = 0; j <= Math.min(value, n - 1); j++) s += pmf[j];
    return s;
  }
  if (dir === "high") return value <= 1 ? 1 : runWalk(n, value).hit;
  return value >= n ? 1 : runWalk(n, value + 1).survive;
}

export function fmt(x: number): string {
  return Math.round(x).toLocaleString("en-US");
}

export function ordinal(x: number): string {
  const v = Math.round(x);
  const k = v % 100;
  if (k >= 11 && k <= 13) return `${v}th`;
  switch (v % 10) {
    case 1:
      return `${v}st`;
    case 2:
      return `${v}nd`;
    case 3:
      return `${v}rd`;
    default:
      return `${v}th`;
  }
}

export function percentile(pct: number): string {
  if (pct >= 99.5) return "99th+";
  if (pct < 0.5) return "<1st";
  return ordinal(pct);
}

function sig2(x: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(x)) - 1);
  return Math.round(x / mag) * mag;
}

export function oneIn(p: number): string {
  const x = 1 / p;
  const units: readonly (readonly [number, string])[] = [
    [1e12, "trillion"],
    [1e9, "billion"],
    [1e6, "million"],
  ];
  for (const [u, name] of units) if (x >= u) return `${sig2(x / u)} ${name}`;
  return fmt(sig2(x));
}

export function expectedSwitches(n: number): number {
  return (n - 1) / 2;
}
