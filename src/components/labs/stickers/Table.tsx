"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Crunchy, { type CrunchyMood } from "@/components/Crunchy";
import { Locked, useAccess } from "@/components/access/AccessProvider";
import { fmt, isRare, tap, type Config } from "./config";
import { Director, type Anchors, type Settled, type Visual } from "./director";
import Finale from "./Finale";
import { Game } from "./game";
import Hud from "./Hud";
import { easyPacks, expectedPacks, makeSpec, mean, packChance, remainingPacks } from "./math";
import { ripPack } from "./packAnim";
import PackArt from "./PackArt";
import Pile from "./Pile";
import { drive, SwapSim } from "./sim";
import { percent, talk } from "./talk";

const SPEEDS = [
  { label: "Chill", rate: 2, instant: false, fast: false },
  { label: "Quick", rate: 8, instant: false, fast: true },
  { label: "Fast", rate: 40, instant: true, fast: false },
  { label: "Turbo", rate: 300, instant: true, fast: false },
];

type Props = {
  config: Config;
  onFinished: (packs: number) => void;
  onAgain: () => void;
  onSim: () => void;
};

function center(el: Element | null, fy: number) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height * fy };
}

function measureAnchors(root: HTMLElement): Anchors {
  const mouth = center(root.querySelector('[data-anchor="pack"]'), 0.22) ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.78 };
  const pile = center(root.querySelector('[data-anchor="pile"]'), 0.4) ?? mouth;
  const friends: { x: number; y: number }[] = [];
  root.querySelectorAll('[data-friend]').forEach((el) => {
    const c = center(el, 0.5);
    if (c) friends.push(c);
  });
  return { mouth, pile, friends };
}

export default function Table({ config, onFinished, onAgain, onSim }: Props) {
  const { unlocked, upsell } = useAccess();
  const spec = useMemo(() => makeSpec(config), [config]);
  const expected = useMemo(() => expectedPacks(spec), [spec]);
  const easy = easyPacks(spec);

  const [vis, setVis] = useState<Visual>({ packs: 0, owned: 0, doubles: 0 });
  const [mood, setMood] = useState<CrunchyMood>("smirk");
  const [say, setSay] = useState({ text: "Tap the pack. Let's see what's inside.", n: 0 });
  const [shares, setShares] = useState<number[]>(() => Array.from({ length: config.friends }, () => 0));
  const [remaining, setRemaining] = useState<number | null>(null);
  const [swapEst, setSwapEst] = useState<number | null>(null);
  const [finale, setFinale] = useState<number | null>(null);
  const [auto, setAuto] = useState({ on: false, speed: 1 });

  const rootRef = useRef<HTMLDivElement>(null);
  const albumRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const packRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const dirRef = useRef<Director | null>(null);
  const cancelPack = useRef<(() => void) | null>(null);
  const finishedRef = useRef(onFinished);

  useEffect(() => {
    finishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    const album = albumRef.current;
    const fx = fxRef.current;
    const root = rootRef.current;
    if (!album || !fx || !root) return;
    const game = new Game(config);
    gameRef.current = game;
    const seen = new Set<number>();
    let moodTimer = 0;
    let finaleTimer = 0;
    let lastDeep = 0;
    const dir = new Director({
      album,
      fx,
      spec,
      anchors: () => measureAnchors(root),
      truth: () => game.counts(),
      onVisual: (v) => setVis(v),
      onSettled: (s: Settled) => {
        const left = game.missing();
        const line = talk(s, spec, seen, left, easy);
        if (!s.instant || line.important) {
          setMood(line.mood);
          setSay((p) => ({ text: line.text, n: p.n + 1 }));
          window.clearTimeout(moodTimer);
          moodTimer = window.setTimeout(() => setMood("smirk"), 2600);
        }
        const now = performance.now();
        if (!s.instant || s.done || now - lastDeep > 280) {
          lastDeep = now;
          setShares(game.friendShares());
          setRemaining(remainingPacks(spec, left.mc, left.mr));
        }
      },
      onComplete: () => {
        setAuto((a) => ({ ...a, on: false }));
        finaleTimer = window.setTimeout(() => {
          setFinale(game.packs);
          finishedRef.current(game.packs);
        }, 1100);
      },
    });
    dirRef.current = dir;
    const ro = new ResizeObserver(() => dir.resize());
    ro.observe(album);
    ro.observe(fx);
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        if (dirRef.current === dir) dir.refreshFont();
      });
    }
    return () => {
      ro.disconnect();
      dir.destroy();
      window.clearTimeout(moodTimer);
      window.clearTimeout(finaleTimer);
      cancelPack.current?.();
      cancelPack.current = null;
      dirRef.current = null;
      gameRef.current = null;
    };
  }, [config, spec, easy]);

  useEffect(() => {
    if (config.friends === 0) return;
    const sim = new SwapSim(spec, config.friends, spec.n <= 250 ? 300 : 150);
    return drive(
      sim,
      () => {
        if (sim.finished) setSwapEst(mean(sim.swap, sim.swap.length));
      },
      6,
    );
  }, [config.friends, spec]);

  const rip = useCallback((count: number, o: { instant?: boolean; fast?: boolean; quiet?: boolean } = {}) => {
    const game = gameRef.current;
    const dir = dirRef.current;
    if (!game || !dir || game.done) return false;
    const results = game.rip(count);
    if (results.length === 0) return false;
    const pack = packRef.current;
    if (!o.quiet && pack) {
      cancelPack.current?.();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      cancelPack.current = ripPack(pack, count > 1 ? "ten" : "one", reduced, gameRef.current?.spec.k ?? 5);
    }
    dir.play(results, { instant: o.instant, fast: o.fast });
    return true;
  }, []);

  const ripRef = useRef(rip);
  useEffect(() => {
    ripRef.current = rip;
  }, [rip]);

  useEffect(() => {
    if (!auto.on || !unlocked) return;
    const speed = SPEEDS[auto.speed];
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      acc += (dt / 1000) * speed.rate;
      const m = Math.min(Math.floor(acc), 60);
      if (m > 0) {
        acc -= m;
        ripRef.current(m, { instant: speed.instant || m > 1, fast: speed.fast, quiet: speed.rate > 3 });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto, unlocked]);

  const full = vis.owned >= spec.n || finale !== null;
  const running = auto.on && unlocked;

  const onInspect = (e: MouseEvent) => {
    const dir = dirRef.current;
    if (!dir) return;
    const id = dir.idAt(e.clientX, e.clientY);
    if (id < 0) return;
    tap();
    const c = dir.copiesOf(id);
    const rare = isRare(spec.rareEvery, id);
    const text =
      c === 0
        ? `#${id + 1} is missing. A pack has a ${percent(packChance(spec, rare))} shot at it.`
        : `#${id + 1}: ${c} cop${c > 1 ? "ies" : "y"}${rare ? ", and it's rare!" : "."}`;
    setSay((p) => ({ text, n: p.n + 1 }));
  };

  const speedButtons = SPEEDS.map((s, i) => (
    <button
      key={s.label}
      type="button"
      aria-pressed={auto.speed === i}
      onClick={() => {
        tap();
        setAuto((a) => ({ ...a, speed: i }));
      }}
      className={`h-11 min-w-0 flex-1 rounded-xl text-[12px] font-bold leading-tight transition active:scale-95 ${auto.speed === i ? "bg-ink text-navy-950" : "text-mist"}`}
    >
      {s.label}
      <span className="block text-[9px] font-semibold opacity-70">{s.rate}/s</span>
    </button>
  ));

  const autoRow = (
    <div className={`flex items-center gap-1 rounded-2xl bg-navy-950/45 p-1 ring-1 ring-edge/15 ${unlocked ? "" : "pr-[74px]"}`}>
      <button
        type="button"
        disabled={full}
        onClick={() => {
          tap();
          if (!unlocked) {
            upsell("Auto-rip speed");
            return;
          }
          const starting = !auto.on;
          setAuto((a) => ({ ...a, on: starting }));
          if (starting) setSay((p) => ({ text: `Auto-ripping at ${SPEEDS[auto.speed].rate} packs a second.`, n: p.n + 1 }));
        }}
        className={`h-11 w-[84px] shrink-0 rounded-xl text-sm font-black transition active:scale-95 disabled:opacity-50 ${running ? "bg-coral text-navy-950" : "bg-mint text-navy-950"}`}
      >
        {running ? "■ Stop" : "▶ Auto"}
      </button>
      {speedButtons}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="relative grid h-full min-h-0 touch-manipulation select-none grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-2 overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] [-webkit-touch-callout:none] landscape:grid-cols-[minmax(0,1fr)_minmax(290px,370px)] landscape:grid-rows-[auto_minmax(0,1fr)] landscape:gap-x-3"
    >
      <Hud
        className="landscape:col-start-1 landscape:row-start-1"
        packs={vis.packs}
        owned={vis.owned}
        n={spec.n}
        expected={expected}
        easy={easy}
        remaining={remaining}
        swapEst={swapEst}
        friends={config.friends}
        shares={shares}
        status={say.text}
        statusKey={say.n}
        done={full}
        smooth={!(running && SPEEDS[auto.speed].instant)}
      />

      <div className="glass relative min-h-[140px] min-w-0 overflow-hidden rounded-2xl landscape:col-start-1 landscape:row-start-2">
        <div className="absolute inset-2 touch-manipulation">
          <canvas
            ref={albumRef}
            onClick={onInspect}
            role="img"
            aria-label={`Sticker album: ${vis.owned} of ${spec.n} stickers collected`}
            className="block h-full w-full cursor-pointer"
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-2 landscape:col-start-2 landscape:row-span-2 landscape:row-start-1 landscape:self-center">
        <div className="flex items-end justify-between gap-1 px-1">
          <div key={say.n} className="grid w-[92px] shrink-0 place-items-center pb-1.5 animate-crunch">
            <Crunchy size={64} mood={full ? "grin" : mood} look={{ x: 0.6, y: 0.2 }} />
          </div>
          <button
            type="button"
            data-anchor="pack"
            disabled={full}
            onClick={() => {
              tap();
              rip(1);
            }}
            aria-label="Rip a pack"
            className="relative block h-[clamp(76px,16dvh,132px)] shrink-0 touch-manipulation transition-transform active:scale-95 disabled:opacity-60 landscape:h-[clamp(92px,30dvh,190px)]"
          >
            <div className={`h-full ${running && SPEEDS[auto.speed].rate > 3 ? "animate-wiggle" : "animate-float"}`}>
              <div ref={packRef} className="h-full">
                <PackArt k={spec.k} className="h-full w-auto drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)]" />
              </div>
            </div>
          </button>
          <Pile count={vis.doubles} />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={full}
            onClick={() => {
              tap();
              rip(1);
            }}
            className="h-14 min-w-0 flex-1 touch-manipulation rounded-2xl bg-gold px-4 text-lg font-black text-navy-950 shadow-[0_0_30px_-8px_#ffc94a] transition active:scale-[0.97] disabled:opacity-50"
          >
            Rip a pack
          </button>
          <button
            type="button"
            disabled={full}
            onClick={() => {
              tap();
              rip(10);
            }}
            className="h-14 w-[104px] shrink-0 touch-manipulation rounded-2xl text-lg font-black text-gold ring-2 ring-gold/60 transition active:scale-[0.97] disabled:opacity-50"
          >
            Rip 10
          </button>
        </div>

        <div className="portrait:[@media(max-height:560px)]:hidden">
          <Locked label="Auto-rip speed">{autoRow}</Locked>
        </div>
      </div>

      <canvas ref={fxRef} aria-hidden className="pointer-events-none absolute inset-0 z-30 h-full w-full" />

      {finale !== null && (
        <Finale
          packs={finale}
          spec={spec}
          expected={expected}
          easy={easy}
          friends={config.friends}
          swapEst={swapEst}
          unlocked={unlocked}
          onAgain={onAgain}
          onSim={onSim}
          onUpsell={upsell}
        />
      )}
      <p className="sr-only">
        {fmt(vis.packs)} packs opened, {fmt(vis.owned)} of {fmt(spec.n)} stickers, {fmt(vis.doubles)} doubles.
      </p>
    </div>
  );
}
