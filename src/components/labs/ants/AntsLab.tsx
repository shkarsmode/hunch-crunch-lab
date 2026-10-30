"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import LabShell from "@/components/LabShell";
import Crunchy from "@/components/Crunchy";
import Sheet from "@/components/Sheet";
import { LockIcon, useAccess } from "@/components/access/AccessProvider";
import { ANT_COLORS, VIDEO_SETUP, World, decodeSetup, encodeSetup, type Setup } from "./engine";
import { AntView } from "./view";
import { Clicker } from "./sound";
import { captions, rateAt } from "./story";
import RulePill from "./RulePill";
import SettingsPanel from "./SettingsPanel";

type Speed = "auto" | number;

const FREE_SPEEDS = [10, 100, 1000, 10000];
const FULL_SPEEDS = [100000, 1000000];
const GOLD = "#FFD166";
const fmt = (n: number) => n.toLocaleString("en-US");
const label = (s: Speed) => (s === "auto" ? "Auto" : s >= 1e6 ? "1M/s" : s >= 1000 ? `${s / 1000}K/s` : `${s}/s`);
const same = (a: Setup, b: Setup) => JSON.stringify(a) === JSON.stringify(b);
const noop = () => () => {};
const u = (n: number) => `calc(var(--sw) * ${n} / 1080)`;
const SHADOW = "0 0.06em 0.35em rgba(0,0,0,0.55)";

export default function AntsLab() {
  const { unlocked, upsell, flag, loading } = useAccess();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<AntView | null>(null);
  const worldRef = useRef<World | null>(null);
  const clicker = useRef<Clicker | null>(null);
  const introEl = useRef<HTMLDivElement>(null);
  const pillEls = useRef<(HTMLDivElement | null)[]>([null, null]);
  const capEls = useRef<Record<string, HTMLParagraphElement | null>>({});
  const stepEl = useRef<HTMLParagraphElement>(null);
  const litEl = useRef<HTMLParagraphElement>(null);
  const counterEl = useRef<HTMLDivElement>(null);
  const st = useRef({ running: false, speed: "auto" as Speed, acc: 0, runTime: 0, peak: 0, keepGoing: false, video: true, sound: false, lastStep: 0, hideCounter: true });

  const search = useSyncExternalStore(noop, () => window.location.search, () => "");
  const sharedSetup = useMemo(() => {
    const code = new URLSearchParams(search).get("s");
    const s = code ? decodeSetup(code) : null;
    return s && !same(s, VIDEO_SETUP) ? s : null;
  }, [search]);
  const [chosen, setChosen] = useState<Setup | null>(null);
  const allowShared = unlocked || flag("share.free");
  const shared = chosen === null && sharedSetup !== null && allowShared;
  const blockedShare = chosen === null && sharedSetup !== null && !allowShared && !loading;
  const setup = chosen ?? (shared && sharedSetup ? sharedSetup : VIDEO_SETUP);
  const isVideo = same(setup, VIDEO_SETUP);

  const [version, setVersion] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<Speed>("auto");
  const [sound, setSound] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [info, setInfo] = useState(false);
  const [speedMenu, setSpeedMenu] = useState(false);
  const [hunchDone, setHunchDone] = useState(false);
  const [hunch, setHunch] = useState<"home" | "chaos" | null>(null);
  const [home, setHome] = useState(0);
  const [edge, setEdge] = useState(false);
  const [follow, setFollow] = useState(true);
  const [placing, setPlacing] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sw, setSw] = useState(390);

  const askHunch = !hunchDone && isVideo && sharedSetup === null;

  useEffect(() => {
    st.current.hideCounter = askHunch || home > 0;
  }, [askHunch, home]);

  const attach = useCallback((w: World) => {
    worldRef.current = w;
    const s = st.current;
    s.acc = 0;
    s.runTime = 0;
    s.peak = w.lit;
    s.keepGoing = false;
    if (!viewRef.current && canvasRef.current) viewRef.current = new AntView(canvasRef.current, w);
    else viewRef.current?.attach(w);
  }, []);

  const resetUi = useCallback(() => {
    setFollow(true);
    setHome(0);
    setEdge(false);
  }, []);

  useEffect(() => {
    st.current.video = same(setup, VIDEO_SETUP);
    attach(new World(setup, 1024, true));
  }, [setup, version, attach]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      viewRef.current?.resize(r.width, r.height, Math.min(2.5, window.devicePixelRatio || 1));
      setSw(Math.round(Math.min(r.width, r.height * 0.5625)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stop = useCallback(() => {
    st.current.running = false;
    setRunning(false);
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = worldRef.current;
      const v = viewRef.current;
      const s = st.current;
      if (w && v) {
        let sps = 0;
        if (s.running && !w.edge) {
          sps = s.speed === "auto" ? (s.video ? rateAt(w.step) : Math.min(10000, 24 * Math.exp(0.6 * s.runTime))) : s.speed;
          s.runTime += dt;
          s.acc += sps * dt;
          const n = Math.min(Math.floor(s.acc), 400000);
          if (n > 0) {
            s.acc -= n;
            const before = w.step;
            const wasHome = w.home;
            w.run(n, !s.keepGoing);
            s.lastStep = now;
            if (s.sound) clicker.current?.tick(w.step - before, dt);
            if (w.lit > s.peak) s.peak = w.lit;
            if (w.home && !wasHome) {
              stop();
              s.acc = 0;
              setHome(w.home);
              navigator.vibrate?.([30, 50, 80]);
              if (s.sound) clicker.current?.chime();
            }
            if (w.edge) {
              stop();
              setEdge(true);
            }
          }
        }
        const atHome = Boolean(w.home) && w.step === w.home && !s.keepGoing;
        const cap = s.video ? captions(w.step, atHome) : { intro: 0, watch: 0, highway: 0, collide: 0, undo: 0, empty: atHome ? 1 : 0 };
        v.insets = { top: v.h * (cap.intro > 0.05 ? 0.3 : 0.18), bottom: v.h * 0.24, left: v.w * 0.04, right: v.w * 0.04 };
        v.frame(dt, { rate: s.running ? sps : 0, u: s.acc });
        if (introEl.current) introEl.current.style.opacity = String(cap.intro);
        for (const k of ["watch", "highway", "collide", "undo", "empty"] as const) {
          const el = capEls.current[k];
          if (el) el.style.opacity = String(cap[k]);
        }
        const h = s.video && s.running && sps < 25 ? Math.exp(-(now - s.lastStep) / 250) : 0;
        for (let p = 0; p < 2; p++) {
          const el = pillEls.current[p];
          if (!el) continue;
          const who = [0, 1].filter((a) => a < w.n && w.rule[a] === p);
          const col = who.length === 1 ? ANT_COLORS[w.tone[who[0]]] : "#FFFFFF";
          const on = who.length > 0 ? h : 0;
          el.style.boxShadow = on > 0.01 ? `inset 0 0 0 ${Math.max(2, sw * 0.0037)}px ${col}${Math.round(on * 0.85 * 255).toString(16).padStart(2, "0")}` : "none";
          el.style.background = on > 0.01 ? `color-mix(in srgb, ${col} ${Math.round(on * 10)}%, rgba(255,255,255,0.06))` : "rgba(255,255,255,0.06)";
        }
        if (counterEl.current) counterEl.current.style.opacity = s.hideCounter ? "0" : "1";
        if (stepEl.current) {
          stepEl.current.textContent = `STEP ${fmt(w.step)}`;
          stepEl.current.style.color = atHome ? GOLD : "#DDE5F5";
        }
        if (litEl.current) {
          litEl.current.textContent = `${fmt(w.lit)} CELLS LIT`;
          litEl.current.style.color = atHome ? GOLD : "#8D9AB8";
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stop, sw]);

  const play = useCallback(() => {
    const w = worldRef.current;
    if (!w) return;
    if (w.edge || (w.home && w.step === w.home && !st.current.keepGoing)) setVersion((v) => v + 1);
    setHunchDone(true);
    setHome(0);
    setEdge(false);
    st.current.running = true;
    setRunning(true);
  }, []);

  const restart = useCallback(() => {
    setVersion((v) => v + 1);
    resetUi();
  }, [resetUi]);

  const keepGoing = () => {
    st.current.keepGoing = true;
    setHome(0);
    st.current.running = true;
    setRunning(true);
  };

  const pickSpeed = (s: Speed) => {
    if (typeof s === "number" && s > 10000 && !unlocked) {
      upsell("Turbo speed");
      return;
    }
    st.current.speed = s;
    setSpeed(s);
    setSpeedMenu(false);
  };

  const toggleSound = () => {
    const on = !sound;
    clicker.current ??= new Clicker();
    if (on) clicker.current.enable();
    else clicker.current.disable();
    st.current.sound = on;
    setSound(on);
  };

  const change = (s: Setup) => {
    if (!unlocked && !same(s, VIDEO_SETUP)) {
      upsell("Changing the ants");
      return;
    }
    setChosen(s);
    resetUi();
  };

  const jump = (n: number) => {
    if (!unlocked) return upsell("Jumping to a step");
    const w = new World(setup, 1024, true);
    let peak = 0;
    while (w.step < n && !w.home && !w.edge) {
      w.run(Math.min(2000, n - w.step), true);
      if (w.lit > peak) peak = w.lit;
    }
    attach(w);
    st.current.peak = peak;
    st.current.running = false;
    setRunning(false);
    setFollow(true);
    setEdge(w.edge);
    setHome(w.home);
  };

  const share = async () => {
    if (!unlocked) return upsell("Share links");
    const url = `${window.location.origin}/lab/two-ants?s=${encodeSetup(setup)}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Link copied");
    } catch {
      setToast(url);
    }
    window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, select, textarea")) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (st.current.running) stop();
        else play();
      }
      if (e.key === "r") restart();
      if (e.key === "f") {
        viewRef.current?.follow();
        setFollow(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play, restart, stop]);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gest = useRef({ moved: 0, t: 0, dist: 0, mx: 0, my: 0 });

  const local = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const pair = () => {
    const [a, b] = [...pointers.current.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    if (pointers.current.size === 1) gest.current = { moved: 0, t: performance.now(), dist: 0, mx: 0, my: 0 };
    if (pointers.current.size === 2) Object.assign(gest.current, pair());
  };

  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !viewRef.current) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const v = viewRef.current;
    if (pointers.current.size === 1) {
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      gest.current.moved += Math.abs(dx) + Math.abs(dy);
      if (gest.current.moved > 4) {
        v.panBy(dx, dy);
        setFollow(false);
      }
    } else if (pointers.current.size === 2) {
      const g = pair();
      if (gest.current.dist > 0) v.zoomAt(g.mx, g.my, g.dist / gest.current.dist);
      v.panBy(g.mx - gest.current.mx, g.my - gest.current.my);
      Object.assign(gest.current, g);
      gest.current.moved = 99;
      setFollow(false);
    }
  };

  const onUp = (e: React.PointerEvent) => {
    const p = pointers.current.get(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (!p || pointers.current.size > 0) return;
    if (gest.current.moved < 6 && performance.now() - gest.current.t < 450 && placing !== null && viewRef.current && worldRef.current) {
      const wpt = viewRef.current.toWorld(p.x, p.y);
      const c = worldRef.current.size >> 1;
      const ants = setup.ants.map((a, i) => (i === placing ? { ...a, x: Math.floor(wpt.x) - c, y: Math.floor(wpt.y) - c } : a));
      setPlacing(null);
      change({ ...setup, ants });
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    const p = local(e);
    viewRef.current?.zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
    setFollow(false);
  };

  const cap = (key: string, text: string, size: number, color: string, top: string) => (
    <p
      ref={(el) => {
        capEls.current[key] = el;
      }}
      className="display absolute inset-x-0 px-2 text-center font-extrabold uppercase leading-none"
      style={{ top, fontSize: u(size), color, opacity: 0, textShadow: SHADOW }}
    >
      {text}
    </p>
  );

  return (
    <LabShell
      title="Two ants, same 2 rules"
      shortTitle="Two ants"
      emoji="🐜"
      grid={false}
      video="qKFPDHmAR4Q"
      right={
        <button type="button" onClick={() => setInfo(true)} className="grid h-10 w-10 place-items-center rounded-full font-black text-mist ring-1 ring-edge/25 hover:text-ink" aria-label="How it works">
          ?
        </button>
      }
    >
      <div ref={wrapRef} className="absolute inset-0 bg-[#05060B]">
        <canvas
          ref={canvasRef}
          className={`block h-full w-full touch-none ${placing !== null ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onWheel={onWheel}
          onDoubleClick={(e) => {
            const p = local(e);
            viewRef.current?.zoomAt(p.x, p.y, 2);
            setFollow(false);
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 select-none" style={{ ["--sw" as string]: `${sw}px` }}>
        {isVideo && (
          <div ref={introEl} className="absolute inset-x-0 text-center" style={{ top: "5.5%" }}>
            <p className="display font-extrabold uppercase leading-[1.09] text-[#F4F6FB]" style={{ fontSize: u(92), textShadow: SHADOW }}>
              Two ants
            </p>
            <p className="display font-extrabold uppercase leading-[1.09]" style={{ fontSize: u(92), color: GOLD, textShadow: SHADOW }}>
              Same 2 rules
            </p>
            <div className="flex justify-center" style={{ gap: u(50), marginTop: u(56) }}>
              <RulePill ref={(el) => { pillEls.current[0] = el; }} lit={false} cw label="Dark square: turn right" />
              <RulePill ref={(el) => { pillEls.current[1] = el; }} lit cw={false} label="Lit square: turn left" />
            </div>
          </div>
        )}
        {isVideo && cap("watch", "Watch step 84,876", 74, "#F4F6FB", "11.5%")}
        {isVideo && cap("highway", "One builds a highway", 74, ANT_COLORS[0], "11.5%")}
        {isVideo && cap("collide", "They collide…", 80, "#F4F6FB", "11.2%")}
        {isVideo && cap("undo", "…and undo it all", 80, GOLD, "11.2%")}
        {cap("empty", "Back to empty", 88, GOLD, "11%")}
        <div ref={counterEl} className="absolute inset-x-0 text-center transition-opacity duration-300" style={{ top: "79.5%", opacity: 0 }}>
          <p ref={stepEl} className="display num font-extrabold leading-none" style={{ fontSize: u(62), color: "#DDE5F5", textShadow: SHADOW }}>
            STEP 0
          </p>
          <p ref={litEl} className="num mt-[0.55em] font-semibold leading-none" style={{ fontSize: u(40), color: "#8D9AB8" }}>
            0 CELLS LIT
          </p>
        </div>
      </div>

      {!follow && (
        <button
          type="button"
          onClick={() => {
            viewRef.current?.follow();
            setFollow(true);
          }}
          className="glass absolute right-3 top-2 flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold animate-pop"
        >
          <span aria-hidden>◎</span> Follow
        </button>
      )}

      {((shared && !unlocked) || blockedShare) && (
        <button type="button" onClick={() => upsell(blockedShare ? "Shared setups" : "Making your own setups")} className="glass absolute inset-x-4 top-[24%] mx-auto flex max-w-sm items-center gap-2 rounded-2xl px-3 py-2 text-left text-xs animate-rise">
          <span>🔗</span>
          <span className="flex-1">{blockedShare ? "Someone shared a setup from the full lab." : "A setup shared from the full lab. Make your own?"}</span>
          <span className="font-black text-gold">Unlock</span>
        </button>
      )}

      {placing !== null && (
        <div className="absolute inset-x-4 top-[24%] mx-auto flex max-w-sm items-center gap-2 rounded-2xl bg-cyan px-4 py-2.5 text-sm font-bold text-navy-950 shadow-2xl animate-pop">
          <span className="flex-1">Tap a square to place ant {placing + 1}</span>
          <button type="button" onClick={() => setPlacing(null)} className="rounded-full bg-navy-950/15 px-3 py-1">
            Cancel
          </button>
        </div>
      )}

      {edge && (
        <div className="absolute inset-x-4 top-[24%] mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-coral px-4 py-3 text-sm font-bold text-navy-950 shadow-2xl animate-pop">
          <span className="flex-1">An ant walked off the edge of the lab.</span>
          <button type="button" onClick={restart} className="rounded-full bg-navy-950/15 px-3 py-1">
            Restart
          </button>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none absolute inset-x-4 bottom-28 flex justify-center">
          <p className="max-w-full truncate rounded-full bg-ink px-4 py-2 text-sm font-bold text-navy-950 animate-pop">{toast}</p>
        </div>
      )}

      {askHunch && (
        <div className="absolute inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4">
          <div className="glass relative w-full max-w-sm rounded-3xl p-4 pt-5 text-center shadow-2xl animate-rise">
            <Crunchy size={52} mood="squint" className="absolute -top-8 left-1/2 -translate-x-1/2" />
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Got a hunch? Lock it in.</p>
            <p className="display mt-1 text-lg font-black leading-tight">Will they ever clean up their mess?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setHunch("home"); play(); }} className="rounded-2xl bg-mint px-3 py-2.5 text-sm font-black text-navy-950 active:scale-95">
                They come home
              </button>
              <button type="button" onClick={() => { setHunch("chaos"); play(); }} className="rounded-2xl bg-coral px-3 py-2.5 text-sm font-black text-navy-950 active:scale-95">
                Chaos forever
              </button>
            </div>
            <button type="button" onClick={() => setHunchDone(true)} className="mt-2 text-xs text-mist underline-offset-4 hover:underline">
              Just let me watch
            </button>
          </div>
        </div>
      )}

      {home > 0 && (
        <div className="absolute inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4">
          <div className="glass relative w-full max-w-sm rounded-3xl p-4 pt-5 text-center shadow-2xl animate-pop">
            <Crunchy size={56} mood="grin" className="absolute -top-9 left-1/2 -translate-x-1/2 animate-crunch" />
            <p className="display num mt-2 font-extrabold leading-none" style={{ fontSize: "1.65rem", color: GOLD }}>
              STEP {fmt(home)}
            </p>
            <p className="num mt-1 text-sm font-semibold" style={{ color: GOLD }}>
              0 CELLS LIT
            </p>
            <p className="mt-2 text-sm text-mist">
              {isVideo ? "Empty grid, both ants on their starting squares, facing the same way. It repeats forever." : "Empty grid, every ant back where it started. It repeats forever."}
            </p>
            {hunch && isVideo && <p className="mt-1.5 text-sm font-bold">{hunch === "home" ? "Your hunch was right. 🎯" : "Your hunch said chaos. The ants disagree. 😏"}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { restart(); window.setTimeout(play, 30); }} className="rounded-2xl bg-ink px-3 py-2.5 text-sm font-black text-navy-950 active:scale-95">
                Watch again
              </button>
              <button type="button" onClick={keepGoing} className="rounded-2xl px-3 py-2.5 text-sm font-bold ring-1 ring-edge/40 active:scale-95">
                Keep going
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setHome(0);
                if (unlocked) setSheet(true);
                else upsell("Your own ants");
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gold px-3 py-2.5 text-sm font-black text-navy-950 active:scale-95"
            >
              {!unlocked && <LockIcon />} Try your own ants
            </button>
          </div>
        </div>
      )}

      {speedMenu && (
        <div className="absolute inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4">
          <div className="glass flex flex-wrap justify-center gap-1.5 rounded-2xl p-2 shadow-2xl animate-pop">
            {(["auto", ...FREE_SPEEDS, ...FULL_SPEEDS] as Speed[]).map((s) => {
              const locked = typeof s === "number" && s > 10000 && !unlocked;
              return (
                <button
                  key={String(s)}
                  type="button"
                  onClick={() => pickSpeed(s)}
                  className={`num flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-bold transition ${speed === s ? "bg-ink text-navy-950" : "hover:bg-ink/5"} ${locked ? "text-gold" : ""}`}
                >
                  {locked && <LockIcon className="h-3.5 w-3.5" />}
                  {label(s)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="glass flex items-center gap-1.5 rounded-full p-1.5 shadow-2xl">
          <button type="button" onClick={restart} className="grid h-12 w-12 place-items-center rounded-full text-xl text-mist transition hover:text-ink active:scale-90" aria-label="Restart">
            ↺
          </button>
          <button
            type="button"
            onClick={() => (running ? stop() : play())}
            className="grid h-14 w-14 place-items-center rounded-full bg-gold text-navy-950 shadow-[0_0_30px_-6px_#ffc94a] transition active:scale-90"
            aria-label={running ? "Pause" : "Play"}
          >
            {running ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden><rect x="6" y="5" width="4.2" height="14" rx="1.2" /><rect x="13.8" y="5" width="4.2" height="14" rx="1.2" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" fill="currentColor" aria-hidden><path d="M7 4.8v14.4a1 1 0 0 0 1.5.86l11.6-7.2a1 1 0 0 0 0-1.72L8.5 3.94A1 1 0 0 0 7 4.8Z" /></svg>
            )}
          </button>
          <button type="button" onClick={() => setSpeedMenu((v) => !v)} className="num h-12 min-w-[4.5rem] rounded-full px-3 text-sm font-black ring-1 ring-edge/30 transition active:scale-95" aria-label="Speed">
            {label(speed)}
          </button>
          <button type="button" onClick={toggleSound} className={`grid h-12 w-12 place-items-center rounded-full transition active:scale-90 ${sound ? "text-gold" : "text-mist"}`} aria-label={sound ? "Sound off" : "Sound on"}>
            {sound ? "🔊" : "🔈"}
          </button>
          <button type="button" onClick={() => setSheet(true)} className="relative grid h-12 w-12 place-items-center rounded-full text-mist transition hover:text-ink active:scale-90" aria-label="Settings">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 7h10M18 7h2M4 17h4M12 17h8" strokeLinecap="round" /><circle cx="16" cy="7" r="2.2" /><circle cx="10" cy="17" r="2.2" /></svg>
            {!unlocked && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />}
          </button>
        </div>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Your ants">
        <SettingsPanel setup={setup} onChange={change} onPlace={(i) => (unlocked ? setPlacing(i) : upsell("Placing ants"))} onJump={jump} onShare={share} onClose={() => setSheet(false)} />
      </Sheet>

      <Sheet open={info} onClose={() => setInfo(false)} title="How it works">
        <div className="space-y-3 text-sm text-mist">
          <p><span className="font-bold text-ink">Two rules.</span> On a dark square, turn right. On a lit square, turn left. Then flip the square and step forward.</p>
          <p><span className="font-bold text-ink">Two ants.</span> They take turns, one step each, on the same empty grid. The second starts 15 squares left and 5 up, facing right. The first faces up.</p>
          <p><span className="font-bold text-ink">One ant alone</span> builds a highway after about 10,000 steps and never stops. These two build a mess, then highways, then a giant rectangle. Their highways collide, and from there they undo every square they ever lit.</p>
          <p><span className="font-bold text-ink">At step 84,876</span> the grid is empty again and both ants are back where they started, facing the same way. So it repeats forever.</p>
          <p>Auto plays it at the same pace as the video. Drag to look around, pinch or scroll to zoom. Space plays and pauses.</p>
        </div>
      </Sheet>
    </LabShell>
  );
}
