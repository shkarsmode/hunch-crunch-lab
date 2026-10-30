export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

export const ANT_COLORS = ["#3FD2FF", "#FF4FD8", "#FFD166", "#3EE6A0", "#B69CFF", "#FF7A59"];
const CELL_A = ["#2FB8F0", "#F04FCB", "#E8B84A", "#2BCB8A", "#9A7CF0", "#E8644A"];
const CELL_B = ["#9FEBFF", "#FFB3EE", "#FFE7A3", "#B6F7DA", "#DCD0FF", "#FFC2B0"];
const STATE_COLORS = ["#2FB8F0", "#F04FCB", "#FFD166", "#3EE6A0", "#B69CFF", "#FF7A59", "#E8ECF6", "#7F8BB0"];

export const FRESH = 2500;
export const TRAIL = 46;
const LV = 8;
const RING = 1 << 15;
const MASK = RING - 1;

export type AntSpec = { x: number; y: number; d: number; rule: string; color: number };
export type Setup = { ants: AntSpec[]; wrap: boolean };

export const VIDEO_SETUP: Setup = {
  ants: [
    { x: 0, y: 0, d: 0, rule: "RL", color: 0 },
    { x: -15, y: -5, d: 1, rule: "RL", color: 1 },
  ],
  wrap: false,
};

export function parseRule(rule: string): Int8Array | null {
  const r = rule.trim().toUpperCase();
  if (!/^[LRNU]{2,16}$/.test(r)) return null;
  return Int8Array.from(r, (c) => (c === "R" ? 1 : c === "L" ? 3 : c === "U" ? 2 : 0));
}

function rgb(hex: string) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function pack(r: number, g: number, b: number) {
  return ((255 << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r)) >>> 0;
}

const SHADES = CELL_A.map((a, i) => {
  const A = rgb(a);
  const B = rgb(CELL_B[i]);
  return Uint32Array.from({ length: LV }, (_, l) => {
    const f = (l / (LV - 1)) * 0.65;
    return pack(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f);
  });
});

const STATE_PAL = Uint32Array.from([0, ...STATE_COLORS.map((h) => pack(...(rgb(h) as [number, number, number]))), ...STATE_COLORS.map((h) => pack(...(rgb(h) as [number, number, number])))]);

export class World {
  readonly size: number;
  readonly grid: Uint8Array;
  readonly owner: Uint8Array;
  readonly when: Uint32Array;
  readonly pixels: Uint32Array | null;
  readonly n: number;
  readonly ax: Int32Array;
  readonly ay: Int32Array;
  readonly ad: Int8Array;
  readonly px: Int32Array;
  readonly py: Int32Array;
  readonly pd: Int8Array;
  readonly rule: Uint8Array;
  readonly sx: Int32Array;
  readonly sy: Int32Array;
  readonly sd: Int8Array;
  readonly turns: Int8Array[];
  readonly ks: Uint8Array;
  readonly tone: Uint8Array;
  readonly colors: string[];
  readonly multi: boolean;
  readonly wrap: boolean;
  readonly trail: Int32Array;
  readonly th: Int32Array;
  private ring = new Int32Array(RING);
  private ringStep = new Int32Array(RING);
  private rh = 0;
  private rt = 0;
  step = 0;
  lit = 0;
  home = 0;
  edge = false;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  dMinX = Infinity;
  dMaxX = -Infinity;
  dMinY = Infinity;
  dMaxY = -Infinity;

  constructor(setup: Setup, size = 1024, withPixels = true) {
    this.size = size;
    this.grid = new Uint8Array(size * size);
    this.owner = new Uint8Array(withPixels ? size * size : 0);
    this.when = new Uint32Array(withPixels ? size * size : 0);
    this.pixels = withPixels ? new Uint32Array(size * size) : null;
    this.n = setup.ants.length;
    this.wrap = setup.wrap;
    const n = this.n;
    this.ax = new Int32Array(n);
    this.ay = new Int32Array(n);
    this.ad = new Int8Array(n);
    this.px = new Int32Array(n);
    this.py = new Int32Array(n);
    this.pd = new Int8Array(n);
    this.rule = new Uint8Array(n);
    this.sx = new Int32Array(n);
    this.sy = new Int32Array(n);
    this.sd = new Int8Array(n);
    this.ks = new Uint8Array(n);
    this.tone = new Uint8Array(n);
    this.trail = new Int32Array(n * TRAIL * 2);
    this.th = new Int32Array(n);
    this.turns = [];
    this.colors = [];
    const c = size >> 1;
    setup.ants.forEach((a, i) => {
      const t = parseRule(a.rule) ?? (parseRule("RL") as Int8Array);
      this.turns.push(t);
      this.ks[i] = t.length;
      const ci = Math.abs(a.color | 0) % ANT_COLORS.length;
      this.tone[i] = ci;
      this.colors.push(ANT_COLORS[ci]);
      this.sx[i] = this.ax[i] = this.px[i] = Math.min(size - 1, Math.max(0, c + a.x));
      this.sy[i] = this.ay[i] = this.py[i] = Math.min(size - 1, Math.max(0, c + a.y));
      this.sd[i] = this.ad[i] = this.pd[i] = a.d & 3;
      for (let j = 0; j < TRAIL; j++) {
        this.trail[(i * TRAIL + j) * 2] = this.ax[i];
        this.trail[(i * TRAIL + j) * 2 + 1] = this.ay[i];
      }
    });
    this.multi = this.ks.some((k) => k > 2);
    this.minX = this.maxX = this.ax[0];
    this.minY = this.maxY = this.ay[0];
    for (let i = 0; i < n; i++) this.grow(this.ax[i], this.ay[i]);
  }

  private grow(x: number, y: number) {
    if (x < this.minX) this.minX = x;
    if (x > this.maxX) this.maxX = x;
    if (y < this.minY) this.minY = y;
    if (y > this.maxY) this.maxY = y;
  }

  private mark(i: number) {
    const x = i % this.size;
    const y = (i / this.size) | 0;
    if (x < this.dMinX) this.dMinX = x;
    if (x > this.dMaxX) this.dMaxX = x;
    if (y < this.dMinY) this.dMinY = y;
    if (y > this.dMaxY) this.dMaxY = y;
  }

  atStart() {
    for (let a = 0; a < this.n; a++) if (this.ax[a] !== this.sx[a] || this.ay[a] !== this.sy[a] || this.ad[a] !== this.sd[a]) return false;
    return true;
  }

  run(max: number, stopAtHome = true): number {
    const { grid, pixels, owner, when, size, n, ax, ay, ad, px, py, pd, rule, ks, turns, tone, multi, wrap, trail, th, ring, ringStep } = this;
    let done = 0;
    let lit = this.lit;
    let dx0 = this.dMinX;
    let dx1 = this.dMaxX;
    let dy0 = this.dMinY;
    let dy1 = this.dMaxY;
    while (done < max && !this.edge) {
      const step = this.step;
      for (let a = 0; a < n; a++) {
        let x = ax[a];
        let y = ay[a];
        const i = y * size + x;
        const c = grid[i];
        const k = ks[a];
        const s = c % k;
        const d = (ad[a] + turns[a][s]) & 3;
        const nc = (s + 1) % k;
        grid[i] = nc;
        rule[a] = s;
        px[a] = x;
        py[a] = y;
        pd[a] = ad[a];
        if (c === 0) {
          if (nc !== 0) lit++;
        } else if (nc === 0) lit--;
        if (pixels) {
          if (nc === 0) pixels[i] = 0;
          else if (multi) pixels[i] = STATE_PAL[nc];
          else {
            owner[i] = a;
            when[i] = step;
            pixels[i] = SHADES[tone[a]][LV - 1];
            if (this.rh - this.rt >= RING) {
              const j = this.rt & MASK;
              const old = ring[j];
              if (grid[old] && when[old] === ringStep[j]) pixels[old] = SHADES[tone[owner[old]]][0];
              this.rt++;
            }
            ring[this.rh & MASK] = i;
            ringStep[this.rh & MASK] = step;
            this.rh++;
          }
        }
        if (x < dx0) dx0 = x;
        if (x > dx1) dx1 = x;
        if (y < dy0) dy0 = y;
        if (y > dy1) dy1 = y;
        x += DX[d];
        y += DY[d];
        if (x < 0 || y < 0 || x >= size || y >= size) {
          if (wrap) {
            x = (x + size) % size;
            y = (y + size) % size;
          } else {
            x = Math.min(size - 1, Math.max(0, x));
            y = Math.min(size - 1, Math.max(0, y));
            this.edge = true;
          }
        }
        ax[a] = x;
        ay[a] = y;
        ad[a] = d;
        const h = (th[a] = (th[a] + 1) % TRAIL);
        trail[(a * TRAIL + h) * 2] = x;
        trail[(a * TRAIL + h) * 2 + 1] = y;
      }
      this.step++;
      done++;
      if (lit === 0 && this.atStart()) {
        if (!this.home) this.home = this.step;
        if (stopAtHome) break;
      }
    }
    this.lit = lit;
    this.dMinX = dx0;
    this.dMaxX = dx1;
    this.dMinY = dy0;
    this.dMaxY = dy1;
    if (dx0 <= dx1) {
      this.grow(dx0, dy0);
      this.grow(dx1, dy1);
    }
    for (let a = 0; a < n; a++) this.grow(ax[a], ay[a]);
    return done;
  }

  age() {
    const { pixels, grid, when, owner, tone, ring, ringStep } = this;
    if (!pixels || this.multi) return;
    const now = this.step;
    while (this.rt < this.rh) {
      const j = this.rt & MASK;
      const st = ringStep[j];
      if (now - st < FRESH) break;
      const i = ring[j];
      if (grid[i] && when[i] === st) {
        pixels[i] = SHADES[tone[owner[i]]][0];
        this.mark(i);
      }
      this.rt++;
    }
    for (let q = this.rt; q < this.rh; q++) {
      const j = q & MASK;
      const i = ring[j];
      const st = ringStep[j];
      if (!grid[i] || when[i] !== st) continue;
      const f = 1 - (now - st) / FRESH;
      const col = SHADES[tone[owner[i]]][Math.round(f * f * (LV - 1))];
      if (pixels[i] !== col) {
        pixels[i] = col;
        this.mark(i);
      }
    }
  }

  takeDirty() {
    const r = this.dMinX <= this.dMaxX ? { x: this.dMinX, y: this.dMinY, w: this.dMaxX - this.dMinX + 1, h: this.dMaxY - this.dMinY + 1 } : null;
    this.dMinX = this.dMinY = Infinity;
    this.dMaxX = this.dMaxY = -Infinity;
    return r;
  }
}

export function encodeSetup(s: Setup) {
  const raw = JSON.stringify({ w: s.wrap ? 1 : 0, a: s.ants.map((a) => [a.x, a.y, a.d, a.rule, a.color]) });
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSetup(code: string): Setup | null {
  try {
    const raw = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    const j = JSON.parse(raw) as { w: number; a: [number, number, number, string, number][] };
    const ants = j.a.slice(0, 6).map(([x, y, d, rule, color]) => ({
      x: Math.max(-400, Math.min(400, Math.round(x))),
      y: Math.max(-400, Math.min(400, Math.round(y))),
      d: d & 3,
      rule: parseRule(rule) ? rule.toUpperCase() : "RL",
      color: Math.abs(color | 0) % ANT_COLORS.length,
    }));
    return ants.length ? { ants, wrap: Boolean(j.w) } : null;
  } catch {
    return null;
  }
}
