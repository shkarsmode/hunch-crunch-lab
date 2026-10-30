import { PALETTE, colorOf, isRare } from "./config";
import type { PackResult } from "./game";
import type { Spec } from "./math";

export type Visual = { packs: number; owned: number; doubles: number };

export type Anchor = { x: number; y: number };

export type Anchors = { mouth: Anchor; pile: Anchor; friends: Anchor[] };

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
  album: HTMLCanvasElement;
  fx: HTMLCanvasElement;
  spec: Spec;
  anchors: () => Anchors;
  truth: () => ArrayLike<number>;
  onVisual: (v: Visual) => void;
  onSettled: (s: Settled) => void;
  onComplete: () => void;
};

type Layout = { cols: number; rows: number; pitch: number; tile: number; x0: number; y0: number; shift: number };

type Kind = "new" | "dup" | "in" | "out";

type Flyer = {
  id: number;
  kind: Kind;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  slotEnd: boolean;
  t0: number;
  dur: number;
  bend: number;
  tilt: number;
  size: number;
};

type Pulse = { id: number; t0: number; rare: boolean };

type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; color: string };

type Piece = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; w: number; h: number; color: string; age: number; life: number };

const NAVY = "#0B1020";
const GOLD = "#FFC94A";

const ease = {
  out: (u: number) => 1 - Math.pow(1 - u, 3),
  io: (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  back: (u: number) => 1 + 2.4 * Math.pow(u - 1, 3) + 1.4 * Math.pow(u - 1, 2),
};

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

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

export function computeLayout(n: number, w: number, h: number): Layout {
  let best = { cols: 1, score: -1, pitch: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const pitch = Math.min(w / cols, h / rows, 76);
    const score = pitch * (n % cols === 0 ? 1.22 : 1);
    if (score > best.score) best = { cols, score, pitch };
  }
  const cols = best.cols;
  const rows = Math.ceil(n / cols);
  const pitch = Math.max(2, best.pitch);
  const gap = pitch >= 30 ? 4 : pitch >= 20 ? 3 : pitch >= 12 ? 2 : 1;
  const tile = Math.max(1, pitch - gap);
  const x0 = (w - (cols * pitch - gap)) / 2;
  const y0 = (h - (rows * pitch - gap)) / 2;
  const lastCols = n - (rows - 1) * cols;
  const shift = ((cols - lastCols) * pitch) / 2;
  return { cols, rows, pitch, tile, x0, y0, shift };
}

export class Director {
  private album: HTMLCanvasElement;
  private fx: HTMLCanvasElement;
  private actx: CanvasRenderingContext2D;
  private fctx: CanvasRenderingContext2D;
  private opts: Options;
  private spec: Spec;
  private shown: Uint16Array;
  private vis: Visual = { packs: 0, owned: 0, doubles: 0 };
  private copies = 0;
  private layout: Layout = { cols: 1, rows: 1, pitch: 10, tile: 8, x0: 0, y0: 0, shift: 0 };
  private aw = 0;
  private ah = 0;
  private fw = 0;
  private fh = 0;
  private ox = 0;
  private oy = 0;
  private events: { at: number; run: () => void }[] = [];
  private flyers: Flyer[] = [];
  private pulses: Pulse[] = [];
  private sparks: Spark[] = [];
  private pieces: Piece[] = [];
  private raf = 0;
  private dirty = false;
  private dead = false;
  private reduced: boolean;
  private font: string;
  private lastTick = 0;
  private needsSync = false;

  constructor(opts: Options) {
    this.opts = opts;
    this.album = opts.album;
    this.fx = opts.fx;
    this.spec = opts.spec;
    this.shown = new Uint16Array(opts.spec.n);
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

  snapshot(): Visual {
    return { ...this.vis };
  }

  refreshFont() {
    this.font = getComputedStyle(this.album).fontFamily || this.font;
    this.paintAll();
  }

  resize() {
    const ad = Math.min(window.devicePixelRatio || 1, 3);
    const fd = Math.min(window.devicePixelRatio || 1, 2);
    this.aw = Math.max(1, this.album.clientWidth);
    this.ah = Math.max(1, this.album.clientHeight);
    this.fw = Math.max(1, this.fx.clientWidth);
    this.fh = Math.max(1, this.fx.clientHeight);
    this.album.width = Math.round(this.aw * ad);
    this.album.height = Math.round(this.ah * ad);
    this.fx.width = Math.round(this.fw * fd);
    this.fx.height = Math.round(this.fh * fd);
    this.actx.setTransform(ad, 0, 0, ad, 0, 0);
    this.fctx.setTransform(fd, 0, 0, fd, 0, 0);
    this.layout = computeLayout(this.spec.n, this.aw, this.ah);
    this.measure();
    this.paintAll();
  }

  private measure() {
    const a = this.album.getBoundingClientRect();
    const f = this.fx.getBoundingClientRect();
    this.ox = a.left - f.left;
    this.oy = a.top - f.top;
  }

  tileSize() {
    return this.layout.tile;
  }

  idAt(clientX: number, clientY: number) {
    const r = this.album.getBoundingClientRect();
    const L = this.layout;
    const px = clientX - r.left - L.x0;
    const py = clientY - r.top - L.y0;
    if (px < 0 || py < 0) return -1;
    const row = Math.floor(py / L.pitch);
    if (row >= L.rows) return -1;
    const rx = px - (row === L.rows - 1 ? L.shift : 0);
    const col = Math.floor(rx / L.pitch);
    if (rx < 0 || col >= L.cols) return -1;
    if (rx - col * L.pitch > L.tile + 2 || py - row * L.pitch > L.tile + 2) return -1;
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
    return { x: this.ox + L.x0 + dx + col * L.pitch + L.tile / 2, y: this.oy + L.y0 + row * L.pitch + L.tile / 2 };
  }

  private drawTile(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, id: number, filled: boolean, count: number) {
    const x = cx - size / 2;
    const y = cy - size / 2;
    const r = Math.max(1.5, size * 0.2);
    const rare = isRare(this.spec.rareEvery, id);
    const text = size >= 19;
    if (!filled) {
      rr(ctx, x, y, size, size, r);
      ctx.fillStyle = rare ? "rgba(255,201,74,0.07)" : "rgba(255,255,255,0.05)";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = rare ? "rgba(255,201,74,0.55)" : "rgba(111,128,179,0.3)";
      if (rare && size >= 12) ctx.setLineDash([3, 2.5]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (text) {
        ctx.fillStyle = rare ? "rgba(255,201,74,0.7)" : "rgba(169,182,211,0.5)";
        ctx.font = `700 ${Math.round(size * 0.36)}px ${this.font}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(id + 1), cx, cy + size * 0.03);
      }
      return;
    }
    rr(ctx, x, y, size, size, r);
    if (rare) {
      const g = ctx.createLinearGradient(x, y, x + size, y + size);
      g.addColorStop(0, "#FFF3C4");
      g.addColorStop(0.45, GOLD);
      g.addColorStop(1, "#C98F22");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = PALETTE[colorOf(id)];
    }
    ctx.fill();
    if (size >= 8) {
      ctx.fillStyle = "rgba(255,255,255,0.38)";
      ctx.fillRect(x + size * 0.14, y + size * 0.1, size * 0.46, Math.max(1, size * 0.09));
      ctx.fillStyle = "rgba(11,16,32,0.2)";
      ctx.fillRect(x + size * 0.1, y + size - Math.max(1.5, size * 0.1), size * 0.8, Math.max(1, size * 0.07));
    }
    if (rare && size >= 7) {
      ctx.lineWidth = Math.max(1, size * 0.06);
      ctx.strokeStyle = "#FFF3C4";
      rr(ctx, x + 0.5, y + 0.5, size - 1, size - 1, r);
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      sparkle(ctx, x + size * 0.8, y + size * 0.22, Math.max(2, size * 0.2));
      ctx.fill();
    }
    if (text) {
      ctx.fillStyle = rare ? "#5A3B00" : NAVY;
      ctx.font = `800 ${Math.round(size * 0.4)}px ${this.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(id + 1), cx, cy + size * 0.05);
    }
    if (count > 1 && size >= 34) {
      const bw = size * 0.38;
      const bh = size * 0.26;
      rr(ctx, x + size - bw - 2, y + size - bh - 2, bw, bh, bh / 2);
      ctx.fillStyle = "rgba(11,16,32,0.88)";
      ctx.fill();
      ctx.fillStyle = "#F4F6FB";
      ctx.font = `800 ${Math.round(bh * 0.7)}px ${this.font}`;
      ctx.fillText(`×${count}`, x + size - bw / 2 - 2, y + size - bh / 2 - 1.5);
    }
  }

  private paintTile(i: number) {
    const L = this.layout;
    const col = i % L.cols;
    const row = (i / L.cols) | 0;
    const x = L.x0 + (row === L.rows - 1 ? L.shift : 0) + col * L.pitch;
    const y = L.y0 + row * L.pitch;
    const half = (L.pitch - L.tile) / 2;
    this.actx.clearRect(x - half, y - half, L.pitch, L.pitch);
    this.drawTile(this.actx, x + L.tile / 2, y + L.tile / 2, L.tile, i, this.shown[i] > 0, this.shown[i]);
  }

  private paintAll() {
    this.actx.clearRect(0, 0, this.aw, this.ah);
    for (let i = 0; i < this.spec.n; i++) this.paintTile(i);
  }

  private at(t: number, run: () => void) {
    this.events.push({ at: t, run });
  }

  private flyer(f: Flyer) {
    this.flyers.push(f);
  }

  private makeFlyer(kind: Kind, id: number, from: Anchor, to: Anchor | null, t0: number, dur: number): Flyer {
    const target = to ?? this.slot(id);
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const size = Math.min(46, Math.max(28, this.layout.tile * 1.35));
    return {
      id,
      kind,
      ax: from.x,
      ay: from.y,
      bx: to ? to.x : 0,
      by: to ? to.y : 0,
      slotEnd: !to,
      t0,
      dur,
      bend: (Math.random() - 0.5) * 0.9 * (Math.abs(dx) + Math.abs(dy) > 120 ? 1 : 0.4),
      tilt: (Math.random() - 0.5) * 0.8,
      size,
    };
  }

  private land(id: number) {
    const was = this.shown[id];
    this.shown[id] = was + 1;
    this.copies++;
    if (was === 0) {
      this.vis.owned++;
      if (!this.reduced && this.pulses.length < 80) {
        this.burst(id);
        this.pulses.push({ id, t0: performance.now(), rare: isRare(this.spec.rareEvery, id) });
      }
    }
    this.vis.doubles = this.copies - this.vis.owned;
    if (was === 0 || this.layout.tile >= 34) this.paintTile(id);
    this.dirty = true;
  }

  private leave(id: number) {
    if (this.shown[id] < 2) return;
    this.shown[id]--;
    this.copies--;
    this.vis.doubles = this.copies - this.vis.owned;
    if (this.layout.tile >= 34) this.paintTile(id);
    this.dirty = true;
  }

  private burst(id: number) {
    if (this.reduced || this.sparks.length > 200) return;
    const rare = isRare(this.spec.rareEvery, id);
    const c = this.slot(id);
    const count = rare ? 18 : this.layout.tile < 12 ? 2 : 6;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (rare ? 90 : 55) + Math.random() * (rare ? 150 : 70);
      this.sparks.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 20,
        age: 0,
        life: 0.35 + Math.random() * (rare ? 0.5 : 0.25),
        size: rare ? 2 + Math.random() * 3 : 1.5 + Math.random() * 2,
        color: rare ? (i % 2 ? "#FFF3C4" : GOLD) : PALETTE[colorOf(id)],
      });
    }
    if (this.sparks.length > 400) this.sparks.splice(0, this.sparks.length - 400);
  }

  play(results: PackResult[], o: PlayOptions = {}) {
    if (this.dead || results.length === 0) return;
    this.measure();
    const instant = Boolean(o.instant) || this.reduced;
    const anchors = this.opts.anchors();
    const f0 = this.fx.getBoundingClientRect();
    const mouth = { x: anchors.mouth.x - f0.left, y: anchors.mouth.y - f0.top };
    const pile = { x: anchors.pile.x - f0.left, y: anchors.pile.y - f0.top };
    const friends = anchors.friends.map((p) => ({ x: p.x - f0.left, y: p.y - f0.top }));
    const now = performance.now();
    const many = results.length > 1;
    const gap = many ? 105 : 0;
    const flight = many ? 330 : o.fast ? 300 : 470;
    const stagger = many ? 24 : o.fast ? 30 : 60;
    const lead = many || o.fast ? 60 : 190;
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
      this.at(tPack, () => {
        this.vis.packs = r.pack;
        this.dirty = true;
      });
      let t = tPack;
      let prev = tPack;
      r.draws.forEach((d, i) => {
        const land = Math.max(tPack + lead + flight + i * stagger, prev + 3);
        prev = land;
        t = land;
        const slot = d.fresh;
        this.flyer(this.makeFlyer(slot ? "new" : "dup", d.id, mouth, slot ? null : pile, land - flight, flight));
        this.at(land, () => this.land(d.id));
        if (d.fresh) {
          fresh++;
          if (isRare(this.spec.rareEvery, d.id)) rare.push(d.id);
        } else dups++;
      });
      let slot = -1;
      let open = false;
      const base = t + (many ? 40 : 90);
      for (const w of r.swaps) {
        if (w.dir === "out") {
          slot++;
          open = true;
        } else if (open && !w.gift) {
          open = false;
        } else {
          slot++;
          open = false;
        }
        const shown = slot < maxSlots;
        const dep = base + Math.min(slot, maxSlots - 1) * swapGap;
        const land = dep + swapFlight;
        const fp = friends[Math.min(Math.max(w.friend, 0), Math.max(0, friends.length - 1))] ?? { x: mouth.x, y: mouth.y - 200 };
        if (w.dir === "in") {
          swapsIn++;
          if (shown) this.flyer(this.makeFlyer("in", w.id, fp, null, dep, swapFlight));
          this.at(shown ? land : land - swapFlight + 10, () => this.land(w.id));
        } else {
          swapsOut++;
          if (shown) this.flyer(this.makeFlyer("out", w.id, pile, fp, dep, swapFlight));
          this.at(dep, () => this.leave(w.id));
        }
        t = Math.max(t, shown ? land : dep + 10);
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
    this.celebrate();
    this.opts.onComplete();
  }

  celebrate() {
    if (this.reduced) return;
    const colors = [...PALETTE, GOLD, GOLD];
    const w = this.fw;
    const total = w < 520 ? 90 : 150;
    for (let i = 0; i < total; i++) {
      const fromTop = i % 3 !== 0;
      const size = 5 + Math.random() * 7;
      this.pieces.push({
        x: fromTop ? Math.random() * w : w / 2 + (Math.random() - 0.5) * 60,
        y: fromTop ? -20 - Math.random() * 120 : this.fh * 0.62,
        vx: fromTop ? (Math.random() - 0.5) * 80 : (Math.random() - 0.5) * 520,
        vy: fromTop ? 120 + Math.random() * 180 : -380 - Math.random() * 380,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 12,
        w: size,
        h: size * (0.5 + Math.random() * 0.7),
        color: colors[i % colors.length],
        age: -Math.random() * 0.5,
        life: 2.6 + Math.random() * 1.6,
      });
    }
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
      this.dirty = true;
    }
  }

  private busy() {
    return this.events.length > 0 || this.flyers.length > 0 || this.pulses.length > 0 || this.sparks.length > 0 || this.pieces.length > 0;
  }

  private wake() {
    if (this.raf || this.dead) return;
    this.lastTick = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = 0;
    if (this.dead) return;
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

  private drawFx(now: number, dt: number) {
    const ctx = this.fctx;
    ctx.clearRect(0, 0, this.fw, this.fh);
    const L = this.layout;

    if (this.flyers.length > 0) {
      const keep: Flyer[] = [];
      for (const f of this.flyers) {
        const u = (now - f.t0) / f.dur;
        if (u >= 1) continue;
        keep.push(f);
        if (u < 0) continue;
        const end = f.slotEnd ? this.slot(f.id) : { x: f.bx, y: f.by };
        const mx = (f.ax + end.x) / 2;
        const my = (f.ay + end.y) / 2;
        const cx = mx - (end.y - f.ay) * f.bend;
        const cy = my + (end.x - f.ax) * f.bend - 30;
        const e = u < 0.18 ? 0 : ease.io((u - 0.18) / 0.82);
        const k = u < 0.18 ? ease.out(u / 0.18) * 0.18 : 0.18 + e * 0.82;
        const q = 1 - k;
        const x = q * q * f.ax + 2 * q * k * cx + k * k * end.x;
        const y = q * q * f.ay + 2 * q * k * cy + k * k * end.y;
        const endSize = f.kind === "dup" ? 10 : f.kind === "out" ? 12 : L.tile;
        const size = u < 0.18 ? f.size * lerp(0.3, 1, ease.back(u / 0.18)) : lerp(f.size, endSize, e);
        const alpha = f.kind === "dup" || f.kind === "out" ? 1 - Math.max(0, (u - 0.75) / 0.25) : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.rotate(f.tilt * (1 - e));
        if (isRare(this.spec.rareEvery, f.id) && f.kind !== "dup") {
          ctx.shadowColor = GOLD;
          ctx.shadowBlur = 16;
        } else if (f.kind === "in") {
          ctx.shadowColor = "#3FE0FF";
          ctx.shadowBlur = 12;
        }
        if (f.kind === "dup" || f.kind === "out") {
          this.drawTile(ctx, 0, 0, size, f.id, true, 1);
          ctx.globalAlpha = alpha * 0.5;
          rr(ctx, -size / 2, -size / 2, size, size, size * 0.2);
          ctx.fillStyle = "#6B7AA3";
          ctx.fill();
        } else {
          this.drawTile(ctx, 0, 0, size, f.id, true, 1);
        }
        ctx.restore();
      }
      this.flyers = keep;
    }

    if (this.pulses.length > 0) {
      const keep: Pulse[] = [];
      for (const p of this.pulses) {
        const u = (now - p.t0) / 420;
        if (u >= 1) continue;
        keep.push(p);
        if (u < 0) continue;
        const c = this.slot(p.id);
        const s = 1 + (p.rare ? 0.55 : 0.3) * (1 - ease.out(u));
        const size = L.tile * s;
        this.drawTile(ctx, c.x, c.y, size, p.id, true, 1);
        ctx.globalAlpha = (1 - u) * 0.6;
        rr(ctx, c.x - size / 2, c.y - size / 2, size, size, Math.max(1.5, size * 0.2));
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      this.pulses = keep;
    }

    if (this.sparks.length > 0) {
      const keep: Spark[] = [];
      for (const s of this.sparks) {
        s.age += dt;
        if (s.age >= s.life) continue;
        keep.push(s);
        s.vy += 260 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        ctx.globalAlpha = 1 - s.age / s.life;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
      }
      ctx.globalAlpha = 1;
      this.sparks = keep;
    }

    if (this.pieces.length > 0) {
      const keep: Piece[] = [];
      for (const p of this.pieces) {
        p.age += dt;
        if (p.age >= p.life || p.y > this.fh + 40) continue;
        keep.push(p);
        if (p.age < 0) continue;
        p.vy += 520 * dt;
        p.vx *= 1 - 0.8 * dt;
        p.vy *= 1 - 0.5 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        ctx.save();
        ctx.globalAlpha = Math.min(1, (p.life - p.age) * 1.5);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      this.pieces = keep;
    }
  }
}
