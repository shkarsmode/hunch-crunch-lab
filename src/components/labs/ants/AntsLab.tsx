"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import LabShell from "@/components/LabShell";
import Crunchy from "@/components/Crunchy";
import Sheet from "@/components/Sheet";
import { LockIcon, useAccess } from "@/components/access/AccessProvider";
import { Icon } from "@/components/ui/icons";
import { btn } from "@/components/ui/kit";
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
const INFO = [
  ["Two rules.", "On a dark square, turn right. On a lit square, turn left. Then flip the square and step forward."],
  ["Two ants.", "They take turns, one step each, on the same empty grid. The second starts 15 squares left and 5 up, facing right. The first faces up."],
  ["One ant alone", "builds a highway after about 10,000 steps and never stops. These two build a mess, then highways, then a giant rectangle. Their highways collide, and from there they undo every square they ever lit."],
  ["At step 84,876", "the grid is empty again and both ants are back where they started, facing the same way. So it repeats forever."],
];
const KEYS = [
  ["DRAG", "look around"],
  ["PINCH · SCROLL", "zoom in and out"],
  ["SPACE", "play and pause"],
  ["R · F", "restart · follow"],
];

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

  const speeds = ["auto", ...FREE_SPEEDS, ...FULL_SPEEDS] as Speed[];
  const speedIndex = Math.max(0, speeds.indexOf(speed));
  const overlay = "bottom-[calc(8.25rem+env(safe-area-inset-bottom))]";
  const panel = "rounded-2xl border border-hair bg-navy-850/95 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl";

  return (
    <LabShell
      title="Two ants, same 2 rules"
      shortTitle="Two ants"
      tag="E030 · LIVE"
      grid={false}
      video="qKFPDHmAR4Q"
      right={
        <button
          type="button"
          onClick={() => setInfo(true)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-hair-strong font-mono text-[14px] text-ink/70 transition hover:text-ink active:scale-95"
          aria-label="How it works"
        >
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
        <div ref={counterEl} className="absolute inset-x-0 text-center transition-opacity duration-300" style={{ top: "76%", opacity: 0 }}>
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
          className="enter absolute right-3 top-3 flex h-9 items-center gap-1.5 rounded-lg border border-hair-strong bg-black/60 px-3 font-mono text-[10px] tracking-[0.1em] text-ink/80 backdrop-blur-md transition active:scale-95"
        >
          <Icon.Target size={15} /> FOLLOW
        </button>
      )}

      {((shared && !unlocked) || blockedShare) && (
        <button
          type="button"
          onClick={() => upsell(blockedShare ? "Shared setups" : "Making your own setups")}
          className={`enter absolute inset-x-3 top-3 mx-auto flex max-w-sm items-center gap-3 px-3 py-2.5 text-left ${panel}`}
        >
          <Icon.Share size={18} className="shrink-0 text-ant-a" />
          <span className="flex-1 text-[13px] text-ink/75">{blockedShare ? "Someone shared a setup from the full lab." : "A setup shared from the full lab. Make your own?"}</span>
          <span className="font-mono text-[10px] tracking-[0.1em] text-gold">UNLOCK</span>
        </button>
      )}

      {placing !== null && (
        <div className={`enter absolute inset-x-3 top-3 mx-auto flex max-w-sm items-center gap-3 px-3 py-2.5 ${panel}`}>
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: ANT_COLORS[setup.ants[placing]?.color ?? 0], boxShadow: `0 0 10px ${ANT_COLORS[setup.ants[placing]?.color ?? 0]}` }}
          />
          <span className="flex-1 text-[14px]">Tap a square to place ant {placing + 1}</span>
          <button type="button" onClick={() => setPlacing(null)} className={btn("ghost", "sm")}>
            Cancel
          </button>
        </div>
      )}

      {edge && (
        <div className={`enter absolute inset-x-3 top-3 mx-auto flex max-w-sm items-center gap-3 px-3 py-2.5 ${panel}`}>
          <span className="font-mono text-[13px] text-coral">!</span>
          <span className="flex-1 text-[14px]">An ant walked off the edge of the lab.</span>
          <button type="button" onClick={restart} className={btn("ghost", "sm")}>
            Restart
          </button>
        </div>
      )}

      {toast && (
        <div className={`pointer-events-none absolute inset-x-4 ${overlay} flex justify-center`}>
          <p className="enter max-w-full truncate rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-[#0B0D12]">{toast}</p>
        </div>
      )}

      {askHunch && (
        <div className={`absolute inset-x-0 ${overlay} z-20 flex justify-center px-3`}>
          <div className={`sheet-up relative w-full max-w-sm p-4 pt-6 ${panel}`}>
            <Crunchy size={46} mood="squint" shadow={false} className="absolute -top-7 left-4" />
            <p className="font-mono text-[10px] tracking-[0.12em] text-gold">GOT A HUNCH? LOCK IT IN.</p>
            <p className="mt-1 text-[19px] font-bold leading-tight tracking-[-0.02em]">Will they ever clean up their mess?</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setHunch("home");
                  play();
                }}
                className="flex h-[60px] flex-col items-start justify-center rounded-xl border border-mint/30 bg-mint/[0.06] px-3 text-left transition active:scale-[0.98]"
              >
                <span className="font-mono text-[9px] tracking-[0.12em] text-mint">A</span>
                <span className="text-[15px] font-semibold">They come home</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setHunch("chaos");
                  play();
                }}
                className="flex h-[60px] flex-col items-start justify-center rounded-xl border border-coral/30 bg-coral/[0.06] px-3 text-left transition active:scale-[0.98]"
              >
                <span className="font-mono text-[9px] tracking-[0.12em] text-coral">B</span>
                <span className="text-[15px] font-semibold">Chaos forever</span>
              </button>
            </div>
            <button type="button" onClick={() => setHunchDone(true)} className="mt-3 w-full text-center font-mono text-[10px] tracking-[0.1em] text-ink/40 transition hover:text-ink/70">
              JUST LET ME WATCH
            </button>
          </div>
        </div>
      )}

      {home > 0 && (
        <div className={`absolute inset-x-0 ${overlay} z-20 flex justify-center px-3`}>
          <div className={`sheet-up relative w-full max-w-sm p-4 pt-6 ${panel}`}>
            <Crunchy size={50} mood="grin" shadow={false} className="absolute -top-8 left-4 animate-crunch" />
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[22px] tabular-nums text-gold">STEP {fmt(home)}</p>
              <p className="font-mono text-[10px] tracking-[0.1em] text-gold/80">0 CELLS LIT</p>
            </div>
            <p className="mt-2 text-[14px] leading-snug text-ink/60">
              {isVideo ? "Empty grid, both ants on their starting squares, facing the same way. It repeats forever." : "Empty grid, every ant back where it started. It repeats forever."}
            </p>
            {hunch && isVideo && (
              <p className={`mt-2 flex items-center gap-2 text-[14px] font-semibold ${hunch === "home" ? "text-mint" : "text-coral"}`}>
                {hunch === "home" ? <Icon.Check size={16} /> : <Icon.Close size={15} />}
                {hunch === "home" ? "Your hunch was right." : "Your hunch said chaos. The ants disagree."}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  restart();
                  window.setTimeout(play, 30);
                }}
                className={btn("ghost", "md")}
              >
                <Icon.Reset size={16} /> Watch again
              </button>
              <button type="button" onClick={keepGoing} className={btn("ghost", "md")}>
                Keep going <Icon.Arrow size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setHome(0);
                if (unlocked) setSheet(true);
                else upsell("Your own ants");
              }}
              className={btn("primary", "md", "mt-2 w-full")}
            >
              {!unlocked && <LockIcon className="h-3.5 w-3.5" />} Try your own ants
            </button>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-30 border-t border-hair bg-navy-900/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          <div className="relative grid h-10 grid-cols-7 rounded-xl border border-hair bg-white/[0.03] p-1" role="radiogroup" aria-label="Speed, steps a second">
            <div
              className="absolute inset-y-1 left-1 rounded-lg bg-white/[0.12] transition-transform duration-200 ease-out"
              style={{ width: "calc((100% - 8px) / 7)", transform: `translateX(${speedIndex * 100}%)` }}
            />
            {speeds.map((s) => {
              const locked = typeof s === "number" && s > 10000 && !unlocked;
              const on = speed === s;
              return (
                <button
                  key={String(s)}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pickSpeed(s)}
                  className={`relative flex items-center justify-center gap-0.5 font-mono text-[11px] transition ${on ? "text-ink" : locked ? "text-gold/70" : "text-ink/45 hover:text-ink/80"}`}
                  title={s === "auto" ? "The pace of the video" : `${label(s)} steps`}
                >
                  {locked && <LockIcon className="h-2.5 w-2.5" />}
                  {s === "auto" ? "AUTO" : label(s).replace("/s", "")}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={restart} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-hair-strong text-ink/75 transition hover:text-ink active:scale-95" aria-label="Restart">
              <Icon.Reset size={19} />
            </button>
            <button
              type="button"
              onClick={() => (running ? stop() : play())}
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition active:scale-[0.98] ${running ? "border border-hair-strong text-ink" : "bg-gold text-[#0B0D12] shadow-[0_0_0_1px_rgb(255_201_74/0.45),0_10px_30px_-12px_rgb(255_201_74/0.6)]"}`}
              aria-label={running ? "Pause" : "Play"}
            >
              {running ? <Icon.Pause size={18} /> : <Icon.Play size={18} />}
              {running ? "Pause" : home > 0 || edge ? "Play again" : "Play"}
            </button>
            <button
              type="button"
              onClick={toggleSound}
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition active:scale-95 ${sound ? "border-gold/40 text-gold" : "border-hair-strong text-ink/60"}`}
              aria-label={sound ? "Sound off" : "Sound on"}
            >
              {sound ? <Icon.Sound size={19} /> : <Icon.Mute size={19} />}
            </button>
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="relative flex h-12 shrink-0 items-center gap-1.5 rounded-xl border border-hair-strong px-3 text-[14px] font-medium text-ink/80 transition hover:text-ink active:scale-95"
              aria-label="Ants and rules"
            >
              <Icon.Sliders size={18} /> Ants
              {!unlocked && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-navy-900" />}
            </button>
          </div>
        </div>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Ants and rules">
        <SettingsPanel setup={setup} onChange={change} onPlace={(i) => (unlocked ? setPlacing(i) : upsell("Placing ants"))} onJump={jump} onShare={share} onClose={() => setSheet(false)} />
      </Sheet>

      <Sheet open={info} onClose={() => setInfo(false)} title="How it works">
        <ol className="divide-y divide-hair border-y border-hair text-[14px] leading-relaxed text-ink/60">
          {INFO.map(([lead, text], i) => (
            <li key={lead} className="flex gap-3 py-3">
              <span className="font-mono text-[11px] leading-[1.7] text-gold">{String(i + 1).padStart(2, "0")}</span>
              <p>
                <span className="font-semibold text-ink">{lead}</span> {text}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {KEYS.map(([k, v]) => (
            <div key={k} className="rounded-lg border border-hair px-3 py-2">
              <div className="font-mono text-[10px] tracking-[0.08em] text-ink/80">{k}</div>
              <div className="text-[12px] text-ink/50">{v}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-ink/45">Auto plays it at the same pace as the video.</p>
      </Sheet>
    </LabShell>
  );
}
