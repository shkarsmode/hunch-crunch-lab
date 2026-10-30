export class PackFx {
  private root: HTMLElement;
  private reduced: boolean;
  private anims: Animation[] = [];
  private idleAnim: Animation | null = null;
  private timers: number[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
    this.reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  private part(name: string) {
    return this.root.querySelector<SVGGElement>(`[data-part="${name}"]`);
  }

  private run(el: Element | null, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    if (!el || typeof el.animate !== "function") return null;
    const a = el.animate(frames, opts);
    this.anims.push(a);
    return a;
  }

  private clear() {
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    this.anims.forEach((a) => a.cancel());
    this.anims = [];
    this.idleAnim?.cancel();
    this.idleAnim = null;
  }

  idle() {
    this.clear();
    if (this.reduced || typeof this.root.animate !== "function") return;
    this.idleAnim = this.root.animate(
      [
        { transform: "translateY(0px) scale(1)" },
        { transform: "translateY(-6px) scale(1.04)", offset: 0.5 },
        { transform: "translateY(0px) scale(1)" },
      ],
      { duration: 1047, iterations: Infinity, easing: "ease-in-out" },
    );
  }

  open(ms: number, last: boolean) {
    this.clear();
    if (this.reduced) {
      this.run(this.root, [{ opacity: 0.5 }, { opacity: 1 }], { duration: 200 });
      if (last) this.timers.push(window.setTimeout(() => this.idle(), 400));
      return;
    }
    const d = Math.max(60, ms);
    this.run(this.part("flap"), [{ transform: "translateY(0px) rotate(0deg)", opacity: 1 }, { transform: "translateY(-60px) rotate(-25deg)", opacity: 0 }], {
      duration: d,
      easing: "linear",
      fill: "forwards",
    });
    this.run(this.part("body"), [{ transform: "scaleY(1)" }, { transform: "scaleY(0.8667)" }], { duration: d, easing: "linear", fill: "forwards" });
    this.run(this.root, [{ transform: "scale(1)" }, { transform: "scale(1.08)", offset: 0.5 }, { transform: "scale(1)" }], { duration: d, easing: "ease-in-out" });
    if (!last) return;
    this.timers.push(
      window.setTimeout(() => {
        this.clear();
        this.run(
          this.root,
          [
            { transform: "scale(0.6)", opacity: 0 },
            { transform: "scale(1.06)", opacity: 1, offset: 0.65 },
            { transform: "scale(1)", opacity: 1 },
          ],
          { duration: 360, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
        );
        this.timers.push(window.setTimeout(() => this.idle(), 380));
      }, d + 420),
    );
  }

  destroy() {
    this.clear();
  }
}
