export type RipMode = "one" | "ten";

export function ripPack(root: HTMLElement, mode: RipMode, reduced: boolean, k: number) {
  const part = (name: string) => root.querySelector<SVGGElement>(`[data-part="${name}"]`);
  const body = part("body");
  const top = part("top");
  const glow = part("glow");
  const anims: Animation[] = [];
  const timers: number[] = [];

  const run = (el: Element | null, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
    if (!el || typeof el.animate !== "function") return;
    anims.push(el.animate(frames, opts));
  };

  const ten = mode === "ten";
  const amp = ten ? 7 : 4;
  const shake = ten ? 460 : 240;
  const tearAt = ten ? 300 : 140;
  const dropAt = ten ? 640 : Math.min(520, 220 + (k - 1) * 60);
  const reformAt = ten ? 960 : dropAt + 360;

  if (reduced) {
    run(root, [{ opacity: 0.4 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
    return () => {
      anims.forEach((a) => a.cancel());
    };
  }

  run(
    body,
    [
      { transform: "rotate(0deg) scale(1)" },
      { transform: `rotate(${-amp}deg) scale(0.96)`, offset: 0.2 },
      { transform: `rotate(${amp}deg) scale(0.96)`, offset: 0.4 },
      { transform: `rotate(${-amp * 0.8}deg) scale(0.97)`, offset: 0.6 },
      { transform: `rotate(${amp * 0.6}deg) scale(0.98)`, offset: 0.8 },
      { transform: "rotate(0deg) scale(1.02)" },
    ],
    { duration: shake, easing: "ease-in-out" },
  );

  run(
    top,
    [
      { transform: "translate(0px, 0px) rotate(0deg)", opacity: 1 },
      { transform: "translate(-34px, -58px) rotate(-48deg)", opacity: 0 },
    ],
    { duration: 380, delay: tearAt, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "forwards" },
  );

  run(
    glow,
    [
      { opacity: 0, transform: "scale(0.3)" },
      { opacity: 1, transform: "scale(1)", offset: 0.35 },
      { opacity: 0, transform: `scale(${ten ? 2.4 : 1.6})` },
    ],
    { duration: ten ? 620 : 440, delay: tearAt - 20, easing: "ease-out", fill: "forwards" },
  );

  run(
    body,
    [
      { transform: "translateY(0px) scale(1)", opacity: 1 },
      { transform: "translateY(22px) scale(0.9)", opacity: 0 },
    ],
    { duration: 260, delay: dropAt, easing: "ease-in", fill: "forwards" },
  );

  timers.push(
    window.setTimeout(() => {
      anims.forEach((a) => a.cancel());
      anims.length = 0;
      run(
        root,
        [
          { transform: "translateY(16px) scale(0.55)", opacity: 0 },
          { transform: "translateY(-3px) scale(1.07)", opacity: 1, offset: 0.65 },
          { transform: "translateY(0px) scale(1)", opacity: 1 },
        ],
        { duration: 440, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
      );
    }, reformAt),
  );

  return () => {
    timers.forEach((t) => window.clearTimeout(t));
    anims.forEach((a) => a.cancel());
  };
}
