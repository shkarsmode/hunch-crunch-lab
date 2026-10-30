export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

export const ANT_COLORS = ["#FFC94A", "#3FE0FF", "#FF5C7A", "#3EE6A0", "#B69CFF", "#F4F6FB"];
const STATE_COLORS = ["#FFC94A", "#FF5C7A", "#3FE0FF", "#3EE6A0", "#B69CFF", "#FF9F43", "#F4F6FB", "#6F80B3"];

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

function rgba(hex: string, a = 255) {
  const v = parseInt(hex.slice(1), 16);
  return ((a << 24) | ((v & 255) << 16) | (((v >> 8) & 255) << 8) | ((v >> 16) & 255)) >>> 0;
}

export class World {
  readonly size: number;
  readonly grid: Uint8Array;
  readonly pixels: Uint32Array | null;
  readonly n: number;
  readonly ax: Int32Array;
  readonly ay: Int32Array;
  readonly ad: Int8Array;
  readonly sx: Int32Array;
  readonly sy: Int32Array;
  readonly sd: Int8Array;
  readonly turns: Int8Array[];
  readonly ks: Uint8Array;
  readonly antPal: Uint32Array;
  readonly statePal: Uint32Array;
  readonly colors: string[];
  readonly multi: boolean;
  readonly wrap: boolean;
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
    this.pixels = withPixels ? new Uint32Array(size * size) : null;
    this.n = setup.ants.length;
    this.wrap = setup.wrap;
    this.ax = new Int32Array(this.n);
    this.ay = new Int32Array(this.n);
    this.ad = new Int8Array(this.n);
    this.sx = new Int32Array(this.n);
    this.sy = new Int32Array(this.n);
    this.sd = new Int8Array(this.n);
    this.turns = [];
    this.ks = new Uint8Array(this.n);
    this.antPal = new Uint32Array(this.n);
    this.colors = setup.ants.map((a) => ANT_COLORS[a.color % ANT_COLORS.length]);
    const c = size >> 1;
    setup.ants.forEach((a, i) => {
      const t = parseRule(a.rule) ?? (parseRule("RL") as Int8Array);
      this.turns.push(t);
      this.ks[i] = t.length;
      this.sx[i] = this.ax[i] = Math.min(size - 1, Math.max(0, c + a.x));
      this.sy[i] = this.ay[i] = Math.min(size - 1, Math.max(0, c + a.y));
      this.sd[i] = this.ad[i] = a.d & 3;
      this.antPal[i] = rgba(ANT_COLORS[a.color % ANT_COLORS.length]);
    });
    this.multi = this.ks.some((k) => k > 2);
    this.statePal = Uint32Array.from([0, ...STATE_COLORS.map((h) => rgba(h)), ...STATE_COLORS.map((h) => rgba(h, 170))]);
    this.minX = this.maxX = this.ax[0];
    this.minY = this.maxY = this.ay[0];
    for (let i = 0; i < this.n; i++) this.grow(this.ax[i], this.ay[i]);
  }

  private grow(x: number, y: number) {
    if (x < this.minX) this.minX = x;
    if (x > this.maxX) this.maxX = x;
    if (y < this.minY) this.minY = y;
    if (y > this.maxY) this.maxY = y;
  }

  atStart() {
    for (let a = 0; a < this.n; a++) if (this.ax[a] !== this.sx[a] || this.ay[a] !== this.sy[a] || this.ad[a] !== this.sd[a]) return false;
    return true;
  }

  run(max: number, stopAtHome = true): number {
    const { grid, pixels, size, n, ax, ay, ad, ks, turns, antPal, statePal, multi, wrap } = this;
    let done = 0;
    let lit = this.lit;
    let dx0 = this.dMinX, dx1 = this.dMaxX, dy0 = this.dMinY, dy1 = this.dMaxY;
    while (done < max && !this.edge) {
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
        if (c === 0) {
          if (nc !== 0) lit++;
        } else if (nc === 0) lit--;
        if (pixels) pixels[i] = nc === 0 ? 0 : multi ? statePal[nc] : antPal[a];
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
