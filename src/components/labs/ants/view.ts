import { DX, DY, type World } from "./engine";

export type Insets = { top: number; bottom: number; left: number; right: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export class AntView {
  private ctx: CanvasRenderingContext2D;
  private off: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private img: ImageData | null = null;
  private bg: CanvasGradient | null = null;
  world: World;
  cam = { x: 512, y: 512, z: 12 };
  auto = true;
  w = 1;
  h = 1;
  dpr = 1;
  insets: Insets = { top: 96, bottom: 120, left: 16, right: 16 };

  constructor(private canvas: HTMLCanvasElement, world: World) {
    this.ctx = canvas.getContext("2d")!;
    this.off = document.createElement("canvas");
    this.octx = this.off.getContext("2d")!;
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
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    const g = this.ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height * 0.42, 0, this.canvas.width / 2, this.canvas.height * 0.42, Math.max(this.canvas.width, this.canvas.height) * 0.75);
    g.addColorStop(0, "#141c3a");
    g.addColorStop(1, "#080c19");
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
    const z = clamp(Math.min(aw / (x1 - x0), ah / (y1 - y0)), 0.35, 26);
    return { x: (x0 + x1) / 2 - (left - right) / 2 / z, y: (y0 + y1) / 2 - (top - bottom) / 2 / z, z };
  }

  follow() {
    this.auto = true;
  }

  frame(dt: number) {
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
    this.draw();
  }

  private draw() {
    const { ctx, cam, dpr, world } = this;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.bg ?? "#0b1020";
    ctx.fillRect(0, 0, W, H);
    const z = cam.z * dpr;
    const ox = W / 2 - cam.x * z;
    const oy = H / 2 - cam.y * z;
    if (cam.z >= 7) {
      const a = Math.min(0.13, (cam.z - 7) * 0.02);
      ctx.strokeStyle = `rgba(111,128,179,${a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gx0 = Math.floor(-ox / z);
      const gx1 = Math.ceil((W - ox) / z);
      const gy0 = Math.floor(-oy / z);
      const gy1 = Math.ceil((H - oy) / z);
      for (let x = gx0; x <= gx1; x++) {
        const sx = Math.round(ox + x * z) + 0.5;
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, H);
      }
      for (let y = gy0; y <= gy1; y++) {
        const sy = Math.round(oy + y * z) + 0.5;
        ctx.moveTo(0, sy);
        ctx.lineTo(W, sy);
      }
      ctx.stroke();
    }
    ctx.setTransform(z, 0, 0, z, ox, oy);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.off, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const r = Math.max(z * 0.46, 4.5 * dpr);
    for (let a = 0; a < world.n; a++) {
      const sx = ox + (world.ax[a] + 0.5) * z;
      const sy = oy + (world.ay[a] + 0.5) * z;
      const col = world.colors[a];
      ctx.shadowColor = col;
      ctx.shadowBlur = 14 * dpr;
      ctx.fillStyle = "#0b1020";
      ctx.beginPath();
      ctx.arc(sx, sy, r * 1.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      const d = world.ad[a];
      const fx = DX[d];
      const fy = DY[d];
      ctx.fillStyle = "#0b1020";
      ctx.beginPath();
      ctx.moveTo(sx + fx * r * 0.85, sy + fy * r * 0.85);
      ctx.lineTo(sx - fy * r * 0.45 - fx * r * 0.2, sy + fx * r * 0.45 - fy * r * 0.2);
      ctx.lineTo(sx + fy * r * 0.45 - fx * r * 0.2, sy - fx * r * 0.45 - fy * r * 0.2);
      ctx.closePath();
      ctx.fill();
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
