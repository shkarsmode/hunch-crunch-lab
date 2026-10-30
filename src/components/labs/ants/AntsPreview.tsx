"use client";

import { useEffect, useRef } from "react";
import { encodeSetup, VIDEO_SETUP, World, type Setup } from "./engine";
import { AntView } from "./view";
import { rateAt } from "./story";

// A self-running preview. By default it replays the video's setup at the video's pace;
// pass `setup`, `rate` (steps per second), `paused` or bump `nudge` to drive it from outside.
export default function AntsPreview({
  className = "",
  onStep,
  setup,
  rate = null,
  paused = false,
  nudge = 0,
  reset = 0,
  warm = 0,
}: {
  className?: string;
  onStep?: (step: number, home: boolean) => void;
  setup?: Setup;
  rate?: number | null;
  paused?: boolean;
  nudge?: number;
  reset?: number;
  warm?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ctl = useRef({ onStep, setup: setup ?? VIDEO_SETUP, rate, paused, nudge, reset, warm });

  useEffect(() => {
    ctl.current = { onStep, setup: setup ?? VIDEO_SETUP, rate, paused, nudge, reset, warm };
  }, [onStep, setup, rate, paused, nudge, reset, warm]);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    let key = encodeSetup(ctl.current.setup);
    let world = new World(ctl.current.setup, 1024, true);
    if (ctl.current.warm > 0) world.run(ctl.current.warm, true);
    let nudged = ctl.current.nudge;
    let resets = ctl.current.reset;
    const view = new AntView(cv, world);
    const fit = () => {
      const r = el.getBoundingClientRect();
      view.resize(r.width, r.height, Math.min(2, window.devicePixelRatio || 1));
      view.insets = { top: r.height * 0.08, bottom: r.height * 0.22, left: r.width * 0.06, right: r.width * 0.06 };
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let hold = 0;
    let told = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const restart = () => {
      world = new World(ctl.current.setup, 1024, true);
      view.attach(world);
      acc = 0;
      hold = 0;
    };
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const c = ctl.current;
      const nextKey = encodeSetup(c.setup);
      if (nextKey !== key || c.reset !== resets) {
        key = nextKey;
        resets = c.reset;
        restart();
      }
      if (c.nudge !== nudged) {
        nudged = c.nudge;
        if (!world.home) world.run(1, true);
      }
      if (visible) {
        let sps = 0;
        if (world.home) {
          hold += dt;
          if (hold > 2.2 && !c.paused) restart();
        } else if (!c.paused) {
          sps = c.rate ?? rateAt(world.step);
          acc += sps * dt;
          const n = Math.floor(acc);
          if (n > 0) {
            acc -= n;
            world.run(n, true);
          }
        }
        view.frame(dt, { rate: sps, u: acc });
        told += dt;
        if (c.onStep && told > 0.1) {
          told = 0;
          c.onStep(world.step, world.home > 0);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} className={`relative overflow-hidden bg-[#05060B] ${className}`}>
      <canvas ref={canvas} className="block h-full w-full" aria-label="Two ants building and undoing their pattern" />
    </div>
  );
}
