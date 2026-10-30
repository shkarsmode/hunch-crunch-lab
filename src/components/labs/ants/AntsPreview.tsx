"use client";

import { useEffect, useRef } from "react";
import { VIDEO_SETUP, World } from "./engine";
import { AntView } from "./view";

export default function AntsPreview({ className = "" }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    let world = new World(VIDEO_SETUP, 1024, true);
    const view = new AntView(cv, world);
    view.insets = { top: 14, bottom: 14, left: 14, right: 14 };
    const fit = () => {
      const r = el.getBoundingClientRect();
      view.resize(r.width, r.height, Math.min(2, window.devicePixelRatio || 1));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let hold = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible) {
        if (world.home) {
          hold += dt;
          if (hold > 2.2) {
            world = new World(VIDEO_SETUP, 1024, true);
            view.attach(world);
            t = 0;
            hold = 0;
          }
        } else {
          t += dt;
          const sps = world.step > 20000 && world.lit < 150 ? 300 : Math.min(9000, 60 * Math.exp(0.55 * t));
          world.run(Math.max(1, Math.floor(sps * dt)), true);
        }
        view.frame(dt);
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
    <div ref={wrap} className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvas} className="block h-full w-full" aria-label="Two ants building and undoing their pattern" />
    </div>
  );
}
