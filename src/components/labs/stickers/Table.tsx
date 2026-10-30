"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useAccess } from "@/components/access/AccessProvider";
import type { CrunchyMood } from "@/components/Crunchy";
import { EndControls, PlayControls, SPEEDS } from "./Controls";
import { fmt, fmtPacks, isRare, tap, type Config } from "./config";
import { Director, type Settled, type Visual } from "./director";
import { Game } from "./game";
import { easyPacks, expectedPacks, makeSpec, mean, packChance, remainingPacks } from "./math";
import { PackFx } from "./packAnim";
import Scene, { type CaptionSpec, type PillSpec } from "./Scene";
import { drive, SwapSim } from "./sim";
import { percent, talk } from "./talk";
import { CORAL, CYAN, GOLD, MINT, PRICE, VH, VW } from "./video";

type Props = {
  config: Config;
  setupOpen: boolean;
  simOpen: boolean;
  onFinished: (packs: number) => void;
  onAgain: () => void;
  onSim: () => void;
  onSetup: () => void;
};

export default function Table({ config, setupOpen, simOpen, onFinished, onAgain, onSim, onSetup }: Props) {
  const { unlocked, upsell } = useAccess();
  const spec = useMemo(() => makeSpec(config), [config]);
  const expected = useMemo(() => expectedPacks(spec), [spec]);
  const easy = easyPacks(spec);

  const [vis, setVis] = useState<Visual>({ packs: 0, owned: 0, doubles: 0 });
  const [mood, setMood] = useState<CrunchyMood>("smirk");
  const [say, setSay] = useState<CaptionSpec>({ markup: "Tap the pack.|Let's [g]crunch[/] it.", hold: 0, n: 0 });
  const [banner, setBanner] = useState<{ text: string; n: number } | null>(null);
  const [shares, setShares] = useState<number[]>(() => Array.from({ length: config.friends }, () => 0));
  const [remaining, setRemaining] = useState<number | null>(null);
  const [left, setLeft] = useState<{ mc: number; mr: number } | null>(null);
  const [swapEst, setSwapEst] = useState<number | null>(null);
  const [finale, setFinale] = useState<number | null>(null);
  const [auto, setAuto] = useState({ on: false, speed: 1 });
  const [area, setArea] = useState<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const albumRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const packRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const dirRef = useRef<Director | null>(null);
  const packFxRef = useRef<PackFx | null>(null);
  const bannerTimer = useRef(0);
  const finishedRef = useRef(onFinished);

  const s = box ? Math.max(0.1, Math.min(box.w / VW, (box.h - 12) / VH)) : 0.3472;
  const packOn = finale === null;

  useEffect(() => {
    finishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    if (!area) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(area);
    return () => ro.disconnect();
  }, [area]);

  useEffect(() => {
    const stage = stageRef.current;
    const album = albumRef.current;
    const fx = fxRef.current;
    const root = rootRef.current;
    if (!stage || !album || !fx || !root) return;
    const game = new Game(config);
    gameRef.current = game;
    const seen = new Set<number>();
    let moodTimer = 0;
    let finaleTimer = 0;
    let lastDeep = 0;
    let deepTimer = 0;
    const deep = () => {
      const rest = game.missing();
      setShares(game.friendShares());
      setRemaining(remainingPacks(spec, rest.mc, rest.mr));
      setLeft(rest);
    };
    const dir = new Director({
      stage,
      album,
      fx,
      spec,
      friends: () => Array.from(root.querySelectorAll("[data-friend]")),
      truth: () => game.counts(),
      onVisual: (v) => setVis(v),
      onOpen: (ms, last) => packFxRef.current?.open(ms, last),
      onSettled: (st: Settled) => {
        const rest = game.missing();
        const line = talk(st, spec, seen, rest, easy);
        if (!st.instant || line.important) {
          setMood(line.mood);
          setSay((p) => ({ markup: line.markup, hold: st.done ? 0 : 2800, n: p.n + 1 }));
          window.clearTimeout(moodTimer);
          moodTimer = window.setTimeout(() => setMood("smirk"), 2600);
        }
        if (line.banner) {
          const text = line.banner;
          setBanner((p) => ({ text, n: (p?.n ?? 0) + 1 }));
          window.clearTimeout(bannerTimer.current);
          bannerTimer.current = window.setTimeout(() => setBanner(null), 3300);
        }
        const now = performance.now();
        if (!st.instant || st.done || now - lastDeep > 280) {
          lastDeep = now;
          deep();
        }
        if (st.instant) {
          window.clearTimeout(deepTimer);
          deepTimer = window.setTimeout(deep, 320);
        }
      },
      onComplete: () => {
        setAuto((a) => ({ ...a, on: false }));
        finaleTimer = window.setTimeout(() => {
          setFinale(game.packs);
          finishedRef.current(game.packs);
        }, 700);
      },
    });
    dirRef.current = dir;
    const ro = new ResizeObserver(() => dir.resize());
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
      window.clearTimeout(deepTimer);
      window.clearTimeout(bannerTimer.current);
      dirRef.current = null;
      gameRef.current = null;
    };
  }, [config, spec, easy]);

  useEffect(() => {
    dirRef.current?.resize();
  }, [s, box]);

  useEffect(() => {
    if (!packOn) return;
    const el = packRef.current;
    if (!el) return;
    const fx = new PackFx(el);
    fx.idle();
    packFxRef.current = fx;
    return () => {
      fx.destroy();
      packFxRef.current = null;
    };
  }, [packOn]);

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

  const rip = useCallback((count: number, o: { instant?: boolean; fast?: boolean } = {}) => {
    const game = gameRef.current;
    const dir = dirRef.current;
    if (!game || !dir || game.done) return false;
    const results = game.rip(count);
    if (results.length === 0) return false;
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
        ripRef.current(m, { instant: speed.instant || m > 1, fast: speed.fast });
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
    const markup =
      c === 0
        ? `[w]#${id + 1}[/] [r]missing.[/]|[c]${percent(packChance(spec, rare))}[/] per pack.`
        : `[w]#${id + 1}:[/] [g]${c}[/] ${c > 1 ? "copies" : "copy"}.${rare ? "|[g]Rare![/]" : ""}`;
    setSay((p) => ({ markup, hold: 2200, n: p.n + 1 }));
  };

  const onAuto = () => {
    tap();
    if (!unlocked) {
      upsell("Auto-rip speed");
      return;
    }
    const starting = !auto.on;
    setAuto((a) => ({ ...a, on: starting }));
    if (starting) setSay((p) => ({ markup: `[m]Auto[/]-rip:|[c]${SPEEDS[auto.speed].rate}[/] packs a second.`, hold: 2600, n: p.n + 1 }));
  };

  const pills = useMemo<PillSpec[]>(() => {
    if (finale !== null) {
      return [
        { text: `you: ${fmt(finale)} packs`, color: MINT },
        { text: `average ≈ ${fmtPacks(expected)}`, color: GOLD },
        { text: `easy math: ${fmt(easy)}`, color: CYAN },
      ];
    }
    if (left && left.mc + left.mr === 1 && vis.owned === spec.n - 1) {
      const q = packChance(spec, left.mr === 1);
      return [{ text: `≈ 1 in ${fmt(Math.round(1 / q))} packs`, color: CORAL }];
    }
    const list: PillSpec[] = [
      { text: `${fmt(spec.n)} ÷ ${spec.k} = ${fmt(easy)} packs = $${fmt(easy * PRICE)}`, color: CYAN },
      { text: `average ≈ ${fmtPacks(expected)} packs`, color: GOLD },
    ];
    if (config.friends > 0 && swapEst !== null) list.push({ text: `friends ≈ ${fmt(Math.round(swapEst))}`, color: MINT });
    return list;
  }, [finale, left, vis.owned, spec, easy, expected, config.friends, swapEst]);

  const bg: CSSProperties = {
    backgroundImage: [
      `radial-gradient(circle ${Math.round(1440 * s)}px at 50% 46%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)`,
      `linear-gradient(rgba(127,156,255,0.035) ${Math.max(1, 1.5 * s)}px, transparent ${Math.max(1, 1.5 * s)}px)`,
      `linear-gradient(90deg, rgba(127,156,255,0.035) ${Math.max(1, 1.5 * s)}px, transparent ${Math.max(1, 1.5 * s)}px)`,
      "linear-gradient(180deg, #0B1022, #111933)",
    ].join(","),
    backgroundSize: `auto, ${54 * s}px ${54 * s}px, ${54 * s}px ${54 * s}px, auto`,
  };

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-0 select-none flex-col overflow-hidden [-webkit-touch-callout:none] landscape:flex-row"
      style={bg}
    >
      <div ref={setArea} className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="absolute left-1/2 top-1/2" style={{ transform: "translate(-50%, -50%)" }}>
          <Scene
            s={s}
            ready={box !== null}
            stageRef={stageRef}
            albumRef={albumRef}
            packRef={packRef}
            n={spec.n}
            k={spec.k}
            vis={vis}
            mood={mood}
            bump={say.n}
            caption={say}
            banner={banner}
            pills={pills}
            done={finale}
            onPack={() => {
              tap();
              rip(1);
            }}
            onInspect={onInspect}
          />
        </div>
      </div>

      <div className="no-scrollbar flex-none border-t border-hair bg-navy-900/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl landscape:flex landscape:w-[min(40%,340px)] landscape:flex-col landscape:overflow-y-auto landscape:border-l landscape:border-t-0 landscape:pr-[max(0.75rem,env(safe-area-inset-right))]">
        <div className="mx-auto w-full max-w-md landscape:my-auto">
          {finale === null ? (
            <PlayControls
              unlocked={unlocked}
              upsell={upsell}
              disabled={full}
              auto={auto}
              running={running}
              shares={shares}
              remaining={remaining}
              started={vis.packs > 0}
              onRip={(c) => {
                tap();
                rip(c);
              }}
              onAuto={onAuto}
              onSpeed={(i) => {
                tap();
                setAuto((a) => ({ ...a, speed: i }));
              }}
              setupOpen={setupOpen}
              onSetup={onSetup}
            />
          ) : (
            <EndControls
              spec={spec}
              packs={finale}
              easy={easy}
              expected={expected}
              friends={config.friends}
              swapEst={swapEst}
              unlocked={unlocked}
              simOpen={simOpen}
              onAgain={onAgain}
              onSim={onSim}
              onUpsell={upsell}
            />
          )}
        </div>
      </div>

      <canvas ref={fxRef} aria-hidden className="pointer-events-none absolute inset-0 z-30 h-full w-full" />
      <p className="sr-only">
        {fmt(vis.packs)} packs opened, {fmt(vis.owned)} of {fmt(spec.n)} stickers, {fmt(vis.doubles)} doubles.
      </p>
    </div>
  );
}
