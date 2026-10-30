"use client";

import { useEffect, useRef } from "react";
import { VIDEO_SETUP, World } from "./engine";
import { AntView } from "./view";
import { rateAt } from "./story";

export default function AntsPreview({ className = "" }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    let world = new World(VIDEO_SETUP, 1024, true);
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
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible) {
        let sps = 0;
        if (world.home) {
          hold += dt;
          if (hold > 2.2) {
            world = new World(VIDEO_SETUP, 1024, true);
            view.attach(world);
            acc = 0;
            hold = 0;
          }
        } else {
          sps = rateAt(world.step);
          acc += sps * dt;
          const n = Math.floor(acc);
          if (n > 0) {
            acc -= n;
            world.run(n, true);
          }
        }
        view.frame(dt, { rate: sps, u: acc });
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
