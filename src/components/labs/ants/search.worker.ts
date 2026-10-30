import { World, type Setup } from "./engine";

type Job = { base: Setup; radius: number; max: number };

self.onmessage = (e: MessageEvent<Job>) => {
  const { base, radius, max } = e.data;
  const fixed = base.ants.length > 1 ? base.ants.slice(0, -1) : base.ants;
  const mover = base.ants.length > 1 ? base.ants[base.ants.length - 1] : { x: 0, y: 0, d: 0, rule: "RL", color: 1 };
  const a0 = fixed[0];
  const total = (2 * radius + 1) ** 2 * 4;
  let done = 0;
  let last = performance.now();
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++)
      for (let d = 0; d < 4; d++) {
        done++;
        const x = a0.x + dx;
        const y = a0.y + dy;
        if (fixed.some((f) => f.x === x && f.y === y)) continue;
        const w = new World({ ants: [...fixed, { ...mover, x, y, d }], wrap: base.wrap }, 512, false);
        while (!w.home && !w.edge && w.step < max) w.run(Math.min(25000, max - w.step), true);
        if (w.home) self.postMessage({ type: "hit", hit: { dx, dy, d, period: w.home } });
        const now = performance.now();
        if (now - last > 100) {
          self.postMessage({ type: "progress", done, total });
          last = now;
        }
      }
  self.postMessage({ type: "done", done: total, total });
};
