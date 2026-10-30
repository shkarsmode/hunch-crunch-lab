import { TRAIL, type World } from "./engine";

export type Insets = { top: number; bottom: number; left: number; right: number };
export type Motion = { rate: number; u: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const c01 = (v: number) => clamp(v, 0, 1);
const easeIO = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

function rgba(hex: string, a: number) {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

export class AntView {
  private ctx: CanvasRenderingContext2D;
  private off: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private glow: HTMLCanvasElement;
  private gctx: CanvasRenderingContext2D;
  private blur: boolean;
  private img: ImageData | null = null;
  private bg: CanvasGradient | string = "#05060B";
  private css = new Map<number, string>();
  world: World;
  cam = { x: 512, y: 512, z: 12 };
  auto = true;
  w = 1;
  h = 1;
  dpr = 1;
  insets: Insets = { top: 120, bottom: 160, left: 16, right: 16 };

  constructor(private canvas: HTMLCanvasElement, world: World) {
    this.ctx = canvas.getContext("2d")!;
    this.off = document.createElement("canvas");
    this.octx = this.off.getContext("2d")!;
    this.glow = document.createElement("canvas");
    this.gctx = this.glow.getContext("2d")!;
    this.blur = "filter" in this.gctx;
    this.world = world;
    this.attach(world);
  }

  attach(world: World) {
    this.world = world;
    this.off.width = world.size;
    this.off.height = world.size;
    this.octx.clearRect(0, 0, world.size, world.size);
    this.img = world.pixels ? new ImageData(new Uint8ClampedArray(world.pixels.buffer as ArrayBuffer), world.size, world.size) : null;
    if (this.img) this.octx.putImageData(this.img, 0, 0);
    world.takeDirty();
    this.auto = true;
    this.cam = this.target();
  }

  resize(w: number, h: number, dpr: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.dpr = dpr;
    const W = (this.canvas.width = Math.round(this.w * dpr));
    const H = (this.canvas.height = Math.round(this.h * dpr));
    this.glow.width = Math.max(1, Math.ceil(W / 4));
    this.glow.height = Math.max(1, Math.ceil(H / 4));
    const g = this.ctx.createRadialGradient(W / 2, H * 0.51, 0, W / 2, H * 0.51, 0.41 * Math.hypot(W, H));
    g.addColorStop(0, "#0C1022");
    g.addColorStop(1, "#05060B");
    this.bg = g;
  }

  private target() {
    const W = this.world;
    const pad = 5;
    const x0 = W.minX - pad;
    const x1 = W.maxX + 1 + pad;
    const y0 = W.minY - pad;
    const y1 = W.maxY + 1 + pad;
    const { top, bottom, left, right } = this.insets;
    const aw = Math.max(60, this.w - left - right);
    const ah = Math.max(60, this.h - top - bottom);
    const z = clamp(Math.min(aw / (x1 - x0), ah / (y1 - y0)), 0.35, 30);
    return { x: (x0 + x1) / 2 - (left - right) / 2 / z, y: (y0 + y1) / 2 - (top - bottom) / 2 / z, z };
  }

  follow() {
    this.auto = true;
  }

  frame(dt: number, m: Motion) {
    this.world.age();
    if (this.img) {
      const r = this.world.takeDirty();
      if (r) this.octx.putImageData(this.img, 0, 0, r.x, r.y, r.w, r.h);
    }
    if (this.auto) {
      const t = this.target();
      const k = 1 - Math.exp(-dt * 2.4);
      this.cam.x += (t.x - this.cam.x) * k;
      this.cam.y += (t.y - this.cam.y) * k;
      this.cam.z *= Math.pow(t.z / this.cam.z, k);
    }
    this.draw(m);
  }

  private color(p: number) {
    let c = this.css.get(p);
    if (!c) {
      c = `rgb(${p & 255},${(p >>> 8) & 255},${(p >>> 16) & 255})`;
      this.css.set(p, c);
    }
    return c;
  }

  private draw(m: Motion) {
    const { ctx, cam, dpr, world: Wd } = this;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, W, H);
    const s = cam.z * dpr;
    const ox = W / 2 - cam.x * s;
    const oy = H / 2 - cam.y * s;

    const ga = 0.11 * c01((s - 7) / 18);
    if (ga > 0.004) {
      ctx.strokeStyle = `rgba(127,139,176,${ga})`;
      ctx.lineWidth = Math.max(1, s * 0.045);
      ctx.beginPath();
      for (let gx = Math.floor(-ox / s) - 1; gx <= Math.ceil((W - ox) / s) + 1; gx++) {
        const X = ox + gx * s;
        ctx.moveTo(X, 0);
        ctx.lineTo(X, H);
      }
      for (let gy = Math.floor(-oy / s) - 1; gy <= Math.ceil((H - oy) / s) + 1; gy++) {
        const Y = oy + gy * s;
        ctx.moveTo(0, Y);
        ctx.lineTo(W, Y);
      }
      ctx.stroke();
    }

    if (Wd.lit > 0) {
      const g = this.gctx;
      const k = this.glow.width / W;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, this.glow.width, this.glow.height);
      if (this.blur) g.filter = `blur(${Math.max(2, s * 0.55) * k}px)`;
      g.imageSmoothingEnabled = true;
      g.setTransform(s * k, 0, 0, s * k, ox * k, oy * k);
      g.drawImage(this.off, 0, 0);
      if (this.blur) g.filter = "none";
      ctx.globalAlpha = 0.55;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.glow, 0, 0, W, H);
      ctx.globalAlpha = 1;

      if (s < 6) {
        ctx.imageSmoothingEnabled = s < 3;
        ctx.setTransform(s, 0, 0, s, ox, oy);
        ctx.drawImage(this.off, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else if (Wd.pixels) {
        const px = Wd.pixels;
        const size = Wd.size;
        const gap = Math.max(0, 0.1 * s - 0.2);
        const rr = Math.min(0.18 * s, 6);
        const x0 = Math.max(Wd.minX, Math.floor(-ox / s));
        const x1 = Math.min(Wd.maxX, Math.ceil((W - ox) / s));
        const y0 = Math.max(Wd.minY, Math.floor(-oy / s));
        const y1 = Math.min(Wd.maxY, Math.ceil((H - oy) / s));
        const paths = new Map<number, Path2D>();
        const round = typeof Path2D.prototype.roundRect === "function";
        for (let y = y0; y <= y1; y++) {
          const row = y * size;
          for (let x = x0; x <= x1; x++) {
            const p = px[row + x];
            if (!p) continue;
            let path = paths.get(p);
            if (!path) {
              path = new Path2D();
              paths.set(p, path);
            }
            const X = ox + x * s + gap / 2;
            const Y = oy + y * s + gap / 2;
            if (round) path.roundRect(X, Y, s - gap, s - gap, rr);
            else path.rect(X, Y, s - gap, s - gap);
          }
        }
        for (const [p, path] of paths) {
          ctx.fillStyle = this.color(p);
          ctx.fill(path);
        }
      }
    }

    const fast = c01((m.rate - 30) / 300);
    for (let a = Wd.n - 1; a >= 0; a--) {
      const col = Wd.colors[a];
      let x = Wd.ax[a] + 0.5;
      let y = Wd.ay[a] + 0.5;
      let ang = Wd.ad[a] * 90;
      if (m.rate < 25 && Wd.step > 0 && !Wd.home) {
        const u = c01(m.u);
        const tu = easeIO(c01(u / 0.35));
        const mu = easeIO(c01((u - 0.25) / 0.5));
        const diff = (Wd.ad[a] - Wd.pd[a] + 4) & 3;
        const sg = diff === 1 ? 1 : diff === 3 ? -1 : diff === 2 ? 2 : 0;
        ang = Wd.pd[a] * 90 + sg * 90 * tu;
        const fx = Wd.px[a] + 0.5;
        const fy = Wd.py[a] + 0.5;
        if (Math.abs(x - fx) + Math.abs(y - fy) <= 1.01) {
          x = fx + (x - fx) * mu;
          y = fy + (y - fy) * mu;
        }
      }
      const X = ox + x * s;
      const Y = oy + y * s;
      const r = Math.max(15, 0.42 * s);
      const R = r * (2.3 + 1.6 * fast);
      const glow = ctx.createRadialGradient(X, Y, 0, X, Y, R);
      glow.addColorStop(0, rgba(col, 0.3 + 0.18 * fast));
      glow.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(X, Y, R, 0, Math.PI * 2);
      ctx.fill();
      if (fast > 0.02) {
        const dot = Math.max(2, 0.28 * s);
        for (let j = 1; j < TRAIL; j++) {
          const h = (Wd.th[a] - j + TRAIL) % TRAIL;
          const tx = Wd.trail[(a * TRAIL + h) * 2] + 0.5;
          const ty = Wd.trail[(a * TRAIL + h) * 2 + 1] + 0.5;
          ctx.fillStyle = rgba(col, 0.55 * fast * (1 - j / TRAIL));
          ctx.beginPath();
          ctx.arc(ox + tx * s, oy + ty * s, dot, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.save();
      ctx.translate(X, Y);
      ctx.rotate((ang * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.05);
      ctx.lineTo(r * 0.82, r * 0.78);
      ctx.lineTo(0, r * 0.42);
      ctx.lineTo(-r * 0.82, r * 0.78);
      ctx.closePath();
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = rgba(col, 0.9);
      ctx.lineWidth = Math.max(2, r * 0.12);
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    }
  }

  toWorld(px: number, py: number) {
    return { x: this.cam.x + (px - this.w / 2) / this.cam.z, y: this.cam.y + (py - this.h / 2) / this.cam.z };
  }

  panBy(dx: number, dy: number) {
    this.auto = false;
    this.cam.x -= dx / this.cam.z;
    this.cam.y -= dy / this.cam.z;
  }

  zoomAt(px: number, py: number, f: number) {
    this.auto = false;
    const before = this.toWorld(px, py);
    this.cam.z = clamp(this.cam.z * f, 0.25, 64);
    const after = this.toWorld(px, py);
    this.cam.x += before.x - after.x;
    this.cam.y += before.y - after.y;
  }
}
