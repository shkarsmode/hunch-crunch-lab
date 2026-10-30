export class Clicker {
  private ctx: AudioContext | null = null;
  private click: AudioBuffer | null = null;

  enable() {
    if (!this.ctx) {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new C();
      const n = Math.floor(this.ctx.sampleRate * 0.02);
      this.click = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = this.click.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * 0.16));
    }
    this.ctx.resume();
  }

  disable() {
    this.ctx?.suspend();
  }

  tick(steps: number, dt: number) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || !this.click || steps <= 0) return;
    const rate = steps / Math.max(dt, 1e-3);
    const count = Math.min(steps, Math.floor(42 * dt + Math.random()));
    const vol = rate > 120 ? 0.045 : 0.13;
    const t0 = ctx.currentTime + 0.01;
    for (let i = 0; i < count; i++) {
      const src = ctx.createBufferSource();
      src.buffer = this.click;
      src.playbackRate.value = 0.75 + Math.random() * 0.7;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1500 + Math.random() * 1900;
      f.Q.value = 5;
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t0 + (i / Math.max(1, count)) * dt);
    }
  }

  chime() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    [523.25, 659.25, 783.99, 1046.5].forEach((hz, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = hz;
      const t = ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.6);
    });
  }
}
