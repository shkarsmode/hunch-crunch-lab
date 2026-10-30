import { PALETTE, colorOf, isRare } from "./config";
import type { PackResult } from "./game";
import type { Spec } from "./math";
import { CORAL, FLY_DUP, GOLD, GRID, INK, MOUTH_Y, PACK, PILE, SLOT, WHITE, Y0, VW } from "./video";

export type Visual = { packs: number; owned: number; doubles: number };

export type Settled = {
  packs: number;
  fresh: number;
  dups: number;
  rare: number[];
  swapsIn: number;
  swapsOut: number;
  done: boolean;
  instant: boolean;
  after: Visual;
};

export type PlayOptions = { instant?: boolean; fast?: boolean };

type Options = {
  stage: HTMLElement;
  album: HTMLCanvasElement;
  fx: HTMLCanvasElement;
  spec: Spec;
  friends: () => Element[];
  truth: () => ArrayLike<number>;
  onVisual: (v: Visual) => void;
  onSettled: (s: Settled) => void;
  onComplete: () => void;
  onOpen: (ms: number, last: boolean) => void;
};

type Layout = { cols: number; rows: number; pitch: number; tile: number; gap: number; x0: number; y0: number; shift: number };

type Kind = "new" | "dup" | "in" | "out";

type Flyer = {
  id: number;
  kind: Kind;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  slotEnd: boolean;
  t0: number;
  dur: number;
  arc: number;
  size0: number;
  size1: number;
};

type Flash = { id: number; t0: number };

type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; color: string };

const PAD = 12;
const AX = GRID.x - PAD;
const AY = GRID.y - PAD;
export const ALBUM_VW = GRID.w + PAD * 2;
export const ALBUM_VH = GRID.h + PAD * 2;
export const ALBUM_X = AX;
export const ALBUM_Y = AY;

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const ioCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const k = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

function sparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.closePath();
}

export function computeLayout(n: number): Layout {
  const g = GRID.gap;
  let best = { cols: 1, score: -1, pitch: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const pitch = Math.min(GRID.w / (cols - g), GRID.h / (rows - g), 118);
    const score = pitch * (n % cols === 0 ? 1.03 : 1);
    if (score > best.score) best = { cols, score, pitch };
  }
  const cols = best.cols;
  const rows = Math.ceil(n / cols);
  const pitch = best.pitch;
  const gap = pitch * g;
  const tile = pitch - gap;
  const x0 = PAD + (GRID.w - (cols * pitch - gap)) / 2;
  const y0 = PAD + (GRID.h - (rows * pitch - gap)) / 2;
  const lastCols = n - (rows - 1) * cols;
  const shift = ((cols - lastCols) * pitch) / 2;
  return { cols, rows, pitch, tile, gap, x0, y0, shift };
}

export class Director {
  private opts: Options;
  private stage: HTMLElement;
  private album: HTMLCanvasElement;
  private fx: HTMLCanvasElement;
  private actx: CanvasRenderingContext2D;
  private fctx: CanvasRenderingContext2D;
  private spec: Spec;
  private shown: Uint16Array;
  private vis: Visual = { packs: 0, owned: 0, doubles: 0 };
  private copies = 0;
  private layout: Layout;
  private s = 1;
  private fw = 1;
  private fh = 1;
  private events: { at: number; run: () => void }[] = [];
  private flyers: Flyer[] = [];
  private flashes: Flash[] = [];
  private sparks: Spark[] = [];
  private rays: { x: number; y: number; t0: number } | null = null;
  private hole = -1;
  private raf = 0;
  private dirty = false;
  private dead = false;
  private reduced: boolean;
  private font: string;
  private lastTick = 0;
  private clock = 0;
  private needsSync = false;

  constructor(opts: Options) {
    this.opts = opts;
    this.stage = opts.stage;
    this.album = opts.album;
    this.fx = opts.fx;
    this.spec = opts.spec;
    this.shown = new Uint16Array(opts.spec.n);
    this.layout = computeLayout(opts.spec.n);
    const a = opts.album.getContext("2d");
    const f = opts.fx.getContext("2d");
    if (!a || !f) throw new Error("canvas unavailable");
    this.actx = a;
    this.fctx = f;
    this.reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.font = getComputedStyle(opts.album).fontFamily || "system-ui, sans-serif";
    this.resize();
  }

  destroy() {
    this.dead = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  refreshFont() {
    this.font = getComputedStyle(this.album).fontFamily || this.font;
    this.paintAll();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const ad = Math.min(dpr, 3);
    const fd = Math.min(dpr, 2);
    const sr = this.stage.getBoundingClientRect();
    this.s = sr.width / (this.stage.offsetWidth || VW) || 1;
    this.album.width = Math.max(1, Math.round(ALBUM_VW * this.s * ad));
    this.album.height = Math.max(1, Math.round(ALBUM_VH * this.s * ad));
    this.actx.setTransform(ad * this.s, 0, 0, ad * this.s, 0, 0);
    this.fw = Math.max(1, this.fx.clientWidth);
    this.fh = Math.max(1, this.fx.clientHeight);
    this.fx.width = Math.round(this.fw * fd);
    this.fx.height = Math.round(this.fh * fd);
    this.paintAll();
    this.measure();
  }

  private measure() {
    const fd = Math.min(window.devicePixelRatio || 1, 2);
    const sr = this.stage.getBoundingClientRect();
    const fr = this.fx.getBoundingClientRect();
    this.s = sr.width / (this.stage.offsetWidth || VW) || this.s;
    const ox = sr.left - fr.left;
    const oy = sr.top - fr.top;
    this.fctx.setTransform(fd * this.s, 0, 0, fd * this.s, fd * ox, fd * (oy - Y0 * this.s));
  }

  private toScene(el: Element) {
    const sr = this.stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - sr.left) / this.s, y: (r.top + r.height / 2 - sr.top) / this.s + Y0 };
  }

  idAt(clientX: number, clientY: number) {
    const sr = this.stage.getBoundingClientRect();
    const L = this.layout;
    const px = (clientX - sr.left) / this.s - AX - L.x0;
    const py = (clientY - sr.top) / this.s + Y0 - AY - L.y0;
    if (px < 0 || py < 0) return -1;
    const row = Math.floor(py / L.pitch);
    if (row >= L.rows) return -1;
    const rx = px - (row === L.rows - 1 ? L.shift : 0);
    const col = Math.floor(rx / L.pitch);
    if (rx < 0 || col >= L.cols) return -1;
    if (rx - col * L.pitch > L.tile + L.gap || py - row * L.pitch > L.tile + L.gap) return -1;
    const id = row * L.cols + col;
    return id < this.spec.n ? id : -1;
  }

  copiesOf(id: number) {
    return this.shown[id];
  }

  private slot(id: number) {
    const L = this.layout;
    const col = id % L.cols;
    const row = (id / L.cols) | 0;
    const dx = row === L.rows - 1 ? L.shift : 0;
    return { x: AX + L.x0 + dx + col * L.pitch + L.tile / 2, y: AY + L.y0 + row * L.pitch + L.tile / 2 };
  }

  private drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, d: number, id: number, filled: boolean, count: number) {
    const r = d * 0.178;
    const rare = isRare(this.spec.rareEvery, id);
    rr(ctx, x, y, d, d, r);
    if (!filled) {
      ctx.fillStyle = SLOT;
      ctx.fill();
      if (rare && d >= 14) {
        ctx.lineWidth = Math.max(1, d * 0.06);
        ctx.strokeStyle = "rgba(255,201,74,0.6)";
        ctx.setLineDash([d * 0.14, d * 0.1]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      return;
    }
    if (rare) {
      const g = ctx.createLinearGradient(x, y, x + d, y + d);
      g.addColorStop(0, "#FFF3C4");
      g.addColorStop(0.5, GOLD);
      g.addColorStop(1, "#C98F22");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = PALETTE[colorOf(id)];
    }
    ctx.fill();
    ctx.fillStyle = "rgba(244,246,251,0.35)";
    ctx.fillRect(x + d * 0.1333, y + d * 0.1333, d * 0.45, d * 0.1333);
    if (rare) {
      ctx.lineWidth = Math.max(1.2, d * 0.07);
      ctx.strokeStyle = "#FFF3C4";
      rr(ctx, x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, d - ctx.lineWidth, d - ctx.lineWidth, r);
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      sparkle(ctx, x + d * 0.78, y + d * 0.24, Math.max(2.5, d * 0.2));
      ctx.fill();
    }
    if (d >= 60) {
      ctx.fillStyle = rare ? "rgba(90,59,0,0.75)" : "rgba(10,15,31,0.55)";
      ctx.font = `800 ${Math.round(d * 0.34)}px ${this.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(id + 1), x + d / 2, y + d * 0.56);
      if (count > 1 && d >= 72) {
        const bw = d * 0.4;
        const bh = d * 0.24;
        rr(ctx, x + d - bw - d * 0.06, y + d - bh - d * 0.06, bw, bh, bh / 2);
        ctx.fillStyle = "rgba(10,15,31,0.85)";
        ctx.fill();
        ctx.fillStyle = WHITE;
        ctx.font = `800 ${Math.round(bh * 0.7)}px ${this.font}`;
        ctx.fillText(`x${count}`, x + d - bw / 2 - d * 0.06, y + d - bh / 2 - d * 0.05);
      }
    }
  }

  private cell(i: number) {
    const L = this.layout;
    const col = i % L.cols;
    const row = (i / L.cols) | 0;
    return { x: L.x0 + (row === L.rows - 1 ? L.shift : 0) + col * L.pitch, y: L.y0 + row * L.pitch };
  }

  private paintTile(i: number) {
    const L = this.layout;
    const { x, y } = this.cell(i);
    const half = L.gap / 2;
    this.actx.clearRect(x - half, y - half, L.pitch, L.pitch);
    this.drawTile(this.actx, x, y, L.tile, i, this.shown[i] > 0, this.shown[i]);
  }

  private paintAll() {
    this.actx.clearRect(0, 0, ALBUM_VW, ALBUM_VH);
    for (let i = 0; i < this.spec.n; i++) this.paintTile(i);
  }

  private at(t: number, run: () => void) {
    this.events.push({ at: t, run });
  }

  private flyer(f: Flyer) {
    this.flyers.push(f);
  }

  private now() {
    return this.clock || performance.now();
  }

  private land(id: number) {
    const was = this.shown[id];
    this.shown[id] = was + 1;
    this.copies++;
    if (was === 0) {
      this.vis.owned++;
      this.refreshHole();
    }
    this.vis.doubles = this.copies - this.vis.owned;
    if (was === 0 || this.layout.tile >= 72) this.paintTile(id);
    if (was === 0 && !this.reduced) {
      if (this.flashes.length < 120) this.flashes.push({ id, t0: this.now() });
      if (isRare(this.spec.rareEvery, id)) this.sparkRare(id);
    }
    this.dirty = true;
  }

  private leave(id: number) {
    if (this.shown[id] < 2) return;
    this.shown[id]--;
    this.copies--;
    this.vis.doubles = this.copies - this.vis.owned;
    if (this.layout.tile >= 72) this.paintTile(id);
    this.dirty = true;
  }

  private refreshHole() {
    const n = this.spec.n;
    if (n > 1 && this.vis.owned === n - 1) {
      let h = -1;
      for (let i = 0; i < n; i++) {
        if (this.shown[i] === 0) {
          h = i;
          break;
        }
      }
      this.hole = h;
    } else {
      this.hole = -1;
    }
  }

  private sparkRare(id: number) {
    if (this.sparks.length > 160) return;
    const c = this.slot(id);
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 160 + Math.random() * 300;
      this.sparks.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        age: 0,
        life: 0.4 + Math.random() * 0.5,
        size: 4 + Math.random() * 7,
        color: i % 2 ? "#FFF3C4" : GOLD,
      });
    }
  }

  play(results: PackResult[], o: PlayOptions = {}) {
    if (this.dead || results.length === 0) return;
    this.measure();
    const instant = Boolean(o.instant) || this.reduced;
    const friends = this.opts.friends().map((el) => this.toScene(el));
    const now = performance.now();
    const many = results.length > 1;
    const gap = many ? 110 : 0;
    const open = instant || o.fast ? 0 : many ? 100 : 230;
    const flight = o.fast ? 260 : 300;
    const maxSlots = many ? 2 : 6;
    const swapFlight = many ? 280 : 340;
    const swapGap = many ? 50 : 70;
    let fresh = 0;
    let dups = 0;
    let swapsIn = 0;
    let swapsOut = 0;
    const rare: number[] = [];
    let last = now;
    let done = false;
    const tileEnd = this.layout.tile;

    results.forEach((r, j) => {
      const tPack = now + j * gap;
      if (instant) {
        this.vis.packs = r.pack;
        for (const d of r.draws) {
          if (d.fresh) {
            fresh++;
            if (isRare(this.spec.rareEvery, d.id)) rare.push(d.id);
          } else dups++;
          this.land(d.id);
        }
        for (const s of r.swaps) {
          if (s.dir === "in") {
            swapsIn++;
            this.land(s.id);
          } else {
            swapsOut++;
            this.leave(s.id);
          }
        }
        done = r.done;
        this.dirty = true;
        return;
      }
      const isLast = j === results.length - 1;
      this.at(tPack, () => {
        this.vis.packs = r.pack;
        this.dirty = true;
        if (open > 0) this.opts.onOpen(open, isLast);
      });
      const tLand = tPack + open + flight;
      const k = r.draws.length;
      r.draws.forEach((d, m) => {
        const x0 = PACK.x + (m - (k - 1) / 2) * 14;
        const to = d.fresh ? this.slot(d.id) : { x: PILE.x, y: PILE.y };
        this.flyer({
          id: d.id,
          kind: d.fresh ? "new" : "dup",
          x0,
          y0: MOUTH_Y,
          x1: to.x,
          y1: to.y,
          slotEnd: d.fresh,
          t0: tLand - flight,
          dur: flight,
          arc: d.fresh ? 160 : 70,
          size0: 30,
          size1: d.fresh ? tileEnd : 18,
        });
        this.at(tLand, () => this.land(d.id));
        if (d.fresh) {
          fresh++;
          if (isRare(this.spec.rareEvery, d.id)) rare.push(d.id);
        } else dups++;
      });
      let t = tLand;
      let slot = -1;
      let openPair = false;
      const base = tLand + (many ? 40 : 120);
      for (const w of r.swaps) {
        if (w.dir === "out") {
          slot++;
          openPair = true;
        } else if (openPair && !w.gift) {
          openPair = false;
        } else {
          slot++;
          openPair = false;
        }
        const shownSwap = slot < maxSlots;
        const dep = base + Math.min(slot, maxSlots - 1) * swapGap;
        const land = dep + swapFlight;
        const fp = friends[Math.min(Math.max(w.friend, 0), Math.max(0, friends.length - 1))] ?? { x: PACK.x, y: 1000 };
        if (w.dir === "in") {
          swapsIn++;
          const to = this.slot(w.id);
          if (shownSwap) this.flyer({ id: w.id, kind: "in", x0: fp.x, y0: fp.y, x1: to.x, y1: to.y, slotEnd: true, t0: dep, dur: swapFlight, arc: 110, size0: 30, size1: tileEnd });
          this.at(shownSwap ? land : dep + 10, () => this.land(w.id));
        } else {
          swapsOut++;
          if (shownSwap) this.flyer({ id: w.id, kind: "out", x0: PILE.x, y0: PILE.y, x1: fp.x, y1: fp.y, slotEnd: false, t0: dep, dur: swapFlight, arc: 90, size0: 22, size1: 10 });
          this.at(dep, () => this.leave(w.id));
        }
        t = Math.max(t, shownSwap ? land : dep + 10);
      }
      last = Math.max(last, t);
      done = r.done;
    });

    this.needsSync = true;
    const info: Settled = { packs: results.length, fresh, dups, rare, swapsIn, swapsOut, done, instant, after: this.vis };
    if (instant) {
      this.opts.onVisual({ ...this.vis });
      info.after = { ...this.vis };
      this.opts.onSettled(info);
      if (done) this.finish();
      this.dirty = false;
    } else {
      this.at(last + 40, () => {
        info.after = { ...this.vis };
        this.opts.onSettled(info);
        if (done) this.finish();
      });
    }
    this.wake();
  }

  private finish() {
    this.hole = -1;
    this.celebrate();
    this.opts.onComplete();
  }

  celebrate() {
    if (this.reduced) return;
    this.rays = { x: 180, y: 1470, t0: performance.now() };
    this.wake();
  }

  private syncTruth() {
    const t = this.opts.truth();
    let owned = 0;
    let copies = 0;
    let changed = false;
    for (let i = 0; i < this.spec.n; i++) {
      const c = t[i];
      if (this.shown[i] !== c) {
        this.shown[i] = c;
        this.paintTile(i);
        changed = true;
      }
      if (c > 0) owned++;
      copies += c;
    }
    if (changed || this.vis.owned !== owned || this.vis.doubles !== copies - owned) {
      this.copies = copies;
      this.vis.owned = owned;
      this.vis.doubles = copies - owned;
      this.refreshHole();
      this.dirty = true;
    }
  }

  private busy() {
    return this.events.length > 0 || this.flyers.length > 0 || this.flashes.length > 0 || this.sparks.length > 0 || this.rays !== null || this.hole >= 0;
  }

  private wake() {
    if (this.raf || this.dead) return;
    this.lastTick = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = 0;
    if (this.dead) return;
    this.clock = now;
    const dt = Math.min(0.05, Math.max(0, (now - this.lastTick) / 1000));
    this.lastTick = now;
    if (this.events.length > 0) {
      const due = this.events.filter((e) => e.at <= now).sort((a, b) => a.at - b.at);
      if (due.length > 0) {
        this.events = this.events.filter((e) => e.at > now);
        for (const e of due) e.run();
      }
    }
    this.drawFx(now, dt);
    this.clock = 0;
    if (this.needsSync && this.events.length === 0 && this.flyers.length === 0) {
      this.needsSync = false;
      this.syncTruth();
    }
    if (this.dirty) {
      this.dirty = false;
      this.opts.onVisual({ ...this.vis });
    }
    if (this.busy()) this.raf = requestAnimationFrame(this.tick);
  };

  private pill(ctx: CanvasRenderingContext2D, label: string, cx: number, cy: number, color: string, size: number) {
    ctx.font = `800 ${size}px ${this.font}`;
    const w = ctx.measureText(label).width + size * 1.1;
    const h = size * 1.55;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.globalAlpha = 0.35;
    rr(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 0.95;
    rr(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, cx, cy + size * 0.36);
  }

  private drawFx(now: number, dt: number) {
    const ctx = this.fctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.fx.width, this.fx.height);
    ctx.restore();
    const L = this.layout;

    if (this.flashes.length > 0) {
      const keep: Flash[] = [];
      for (const f of this.flashes) {
        const age = (now - f.t0) / 1000;
        if (age >= 0.35) continue;
        keep.push(f);
        if (age < 0) continue;
        const c = this.slot(f.id);
        const k = L.tile / 22.5;
        const sz = L.tile + 4 * k;
        ctx.globalAlpha = 0.9 * (1 - age / 0.35);
        rr(ctx, c.x - sz / 2, c.y - sz / 2, sz, sz, 5 * k);
        ctx.fillStyle = WHITE;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      this.flashes = keep;
    }

    if (this.flyers.length > 0) {
      const keep: Flyer[] = [];
      for (const f of this.flyers) {
        const u = (now - f.t0) / f.dur;
        if (u >= 1) continue;
        keep.push(f);
        if (u < 0) continue;
        const end = f.slotEnd ? this.slot(f.id) : { x: f.x1, y: f.y1 };
        const swap = f.kind === "in" || f.kind === "out";
        const q = swap ? ioCubic(u) : u * u * u;
        const x = lerp(f.x0, end.x, q);
        const y = lerp(f.y0, end.y, q) - f.arc * Math.sin(Math.PI * u);
        const size = lerp(f.size0, f.size1, q);
        const dupLike = f.kind === "dup" || f.kind === "out";
        ctx.globalAlpha = f.kind === "out" ? 1 - Math.max(0, (u - 0.7) / 0.3) : 1;
        rr(ctx, x - size / 2, y - size / 2, size, size, size * 0.178);
        ctx.fillStyle = dupLike ? FLY_DUP : isRare(this.spec.rareEvery, f.id) ? GOLD : PALETTE[colorOf(f.id)];
        ctx.fill();
        if (f.kind === "in") {
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#3FE0FF";
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      this.flyers = keep;
    }

    if (this.hole >= 0) {
      const c = this.slot(this.hole);
      const g = 0.5 + 0.5 * Math.sin(now / 1000 * 7);
      const d = L.tile;
      const ring = Math.max(34, d * 0.95) + 6 * g;
      ctx.save();
      ctx.shadowColor = CORAL;
      ctx.shadowBlur = 16;
      ctx.globalAlpha = 0.4 + 0.4 * g;
      rr(ctx, c.x - d / 2 - 5, c.y - d / 2 - 5, d + 10, d + 10, 7);
      ctx.fillStyle = CORAL;
      ctx.fill();
      ctx.restore();
      ctx.lineWidth = 3;
      ctx.strokeStyle = CORAL;
      rr(ctx, c.x - d / 2 - 3, c.y - d / 2 - 3, d + 6, d + 6, 6);
      ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(c.x, c.y, ring, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      this.pill(ctx, "1 missing", Math.min(Math.max(c.x, 140), VW - 140), c.y - Math.max(52, ring + 22), CORAL, 24);
    }

    if (this.sparks.length > 0) {
      const keep: Spark[] = [];
      for (const s of this.sparks) {
        s.age += dt;
        if (s.age >= s.life) continue;
        keep.push(s);
        s.vy += 700 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        ctx.globalAlpha = 1 - s.age / s.life;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
      }
      ctx.globalAlpha = 1;
      this.sparks = keep;
    }

    if (this.rays) {
      const tc = (now - this.rays.t0) / 1000;
      if (tc > 0.25) {
        this.rays = null;
      } else if (tc >= 0) {
        const u = tc / 0.25;
        const R = 150;
        ctx.lineCap = "round";
        ctx.lineWidth = R * 0.04;
        ctx.strokeStyle = WHITE;
        ctx.globalAlpha = 1 - u;
        for (let k = 0; k < 9; k++) {
          const ang = (k * 2 * Math.PI) / 9 + 0.3;
          const r0 = R * (0.3 + 0.55 * u);
          const r1 = R * (0.3 + 0.55 * u + 0.22 * (1 - u));
          ctx.beginPath();
          ctx.moveTo(this.rays.x + r0 * Math.cos(ang), this.rays.y + r0 * Math.sin(ang));
          ctx.lineTo(this.rays.x + r1 * Math.cos(ang), this.rays.y + r1 * Math.sin(ang));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
  }
}
