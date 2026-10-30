"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { COINS, domainFor, exactTail, fmt, oneIn, passZone, percentile } from "./engine";
import type { Dist, Metric, Tell } from "./engine";
import { BEAT_MS, RAMP_DELAY, RAMP_MS, rampShown, reducedMotion } from "./fx";
import { EXTRA, SEMI, V, VPill, u, type Tone } from "./scene";

const PW = 870;
const PH = 570;
const HX0 = 30;
const HX1 = 840;
const HTOP = 120;
const HBASE = 460;
const PLOT = HBASE - HTOP;
const FONT = { fontVariationSettings: '"opsz" 14' } as const;

function tickStep(bins: number): number {
  const raw = bins / 7;
  for (const s of [1, 2, 5, 10, 20, 25, 50]) if (s >= raw) return s;
  return 100;
}

function Spot({ x, y, delay = 0, children }: { x: number; y: number; delay?: number; children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: `${(x / PW) * 100}%`, top: `${(y / PH) * 100}%`, transform: "translate(-50%, -50%)" }}>
      <div className="animate-pop" style={{ animationDelay: `${delay}ms` }}>
        {children}
      </div>
    </div>
  );
}

function RampStats({ live, dist, metric }: { live: boolean; dist: Dist; metric: Metric }) {
  const [state, setState] = useState({ count: 0, max: 0 });
  const full = useMemo(() => {
    let m = 0;
    for (let i = 0; i < dist.values.length; i++) if (dist.values[i] > m) m = dist.values[i];
    return m;
  }, [dist]);
  useEffect(() => {
    if (!live) return;
    if (reducedMotion()) {
      const id = window.setTimeout(() => setState({ count: COINS, max: full }), 0);
      return () => window.clearTimeout(id);
    }
    let raf = 0;
    let added = 0;
    let mx = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const shown = rampShown(now - t0);
      while (added < shown) {
        const v = dist.values[added++];
        if (v > mx) mx = v;
      }
      setState((p) => (p.count === shown && p.max === mx ? p : { count: shown, max: mx }));
      if (shown < COINS) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [live, dist, full]);
  const count = live ? state.count : COINS;
  const max = live ? state.max : full;
  return (
    <div className="flex justify-around" style={{ width: u(PW), marginLeft: "auto", marginRight: "auto", paddingBottom: u(26) }}>
      <div className="text-center">
        <div style={{ ...SEMI, fontSize: u(28), lineHeight: 1.2, color: V.muted }}>REAL COINS</div>
        <div className="num" style={{ ...EXTRA, fontSize: u(64), lineHeight: 1.15, color: V.white, textShadow: `0 ${u(3)} ${u(6)} rgb(0 0 0 / 0.5)` }}>
          {fmt(count)}
        </div>
      </div>
      <div className="text-center">
        <div style={{ ...SEMI, fontSize: u(28), lineHeight: 1.2, color: V.muted }}>{metric === "switches" ? "MOST SWITCHES" : "LONGEST STREAK"}</div>
        <div className="num" style={{ ...EXTRA, fontSize: u(64), lineHeight: 1.15, color: V.mint, textShadow: `0 ${u(3)} ${u(6)} rgb(0 0 0 / 0.5)` }}>
          {max}
        </div>
      </div>
    </div>
  );
}

type Props = {
  dist: Dist;
  n: number;
  you: Tell;
  youTone: Tone;
  real: Tell | null;
  realTone: Tone;
  live: boolean;
  title: string;
  onDone: () => void;
};

export default function HistChart({ dist, n, you, youTone, real, realTone, live, title, onDone }: Props) {
  const youV = you.value;
  const realV = real ? real.value : null;
  const { lo, hi } = useMemo(() => domainFor(dist, realV === null ? [youV] : [youV, realV]), [dist, youV, realV]);
  const bins = hi - lo + 1;
  const bw = (HX1 - HX0) / bins;
  const max = useMemo(() => {
    let m = 1;
    for (let v = lo; v <= hi; v++) if (dist.counts[v] > m) m = dist.counts[v];
    return m;
  }, [dist, lo, hi]);
  const zone = useMemo(() => passZone(dist), [dist]);

  const rects = useRef<(SVGRectElement | null)[]>([]);
  const skip = useRef(false);
  const doneRef = useRef(onDone);
  const [ramped, setRamped] = useState(false);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!live) return;
    skip.current = false;
    const nodes = rects.current;
    const cum = new Uint32Array(bins);
    const values = dist.values;
    const fast = reducedMotion();
    const start = performance.now();
    let added = 0;
    let raf = 0;
    let beat = 0;
    const paint = () => {
      for (let b = 0; b < bins; b++) {
        const el = nodes[b];
        if (!el) continue;
        const h = (cum[b] / max) * PLOT;
        el.setAttribute("y", String(HBASE - h));
        el.setAttribute("height", String(h));
      }
    };
    const frame = (now: number) => {
      const t = fast || skip.current ? RAMP_DELAY + RAMP_MS : now - start;
      const shown = rampShown(t);
      while (added < shown) {
        const b = values[added] - lo;
        if (b >= 0 && b < bins) cum[b]++;
        added++;
      }
      paint();
      if (shown < COINS) {
        raf = requestAnimationFrame(frame);
        return;
      }
      setRamped(true);
      beat = window.setTimeout(() => doneRef.current(), fast ? 0 : skip.current ? 140 : BEAT_MS);
    };
    paint();
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(beat);
    };
  }, [live, dist, lo, bins, max]);

  const marks = !live || ramped;
  const clampV = (v: number) => Math.min(Math.max(v, lo), hi);
  const hx = (v: number) => HX0 + (clampV(v) - lo + 0.5) * bw;
  const barH = (v: number) => (dist.counts[clampV(v)] / max) * PLOT;
  const pillY = (v: number) => (barH(v) > PLOT * 0.2 ? HTOP - 32 : Math.max(HTOP - 32, HBASE - 150));
  const pillX = (x: number) => Math.min(Math.max(x, 150), PW - 150);
  const step = tickStep(bins);
  const labels: number[] = [];
  for (let v = lo; v <= hi; v++) if (v % step === 0) labels.push(v);

  const youX = hx(youV);
  const youY = pillY(youV);
  const realX = real ? hx(real.value) : 0;
  let realY = real ? pillY(real.value) : 0;
  if (real && Math.abs(realX - youX) < 190 && realY === youY) realY += 62;
  const count = you.dir === "high" ? you.atLeast : you.atMost;
  const odds = count === 0 ? exactTail(n, you.metric, you.value, you.dir) : 0;
  const calloutX = pillX(youX + (youX > PW / 2 ? -170 : 170));
  const arrow = (v: number) => (v > hi ? " →" : v < lo ? " ←" : "");
  const toneOf = (t: Tone) => (t === "ok" ? V.mint : V.coral);
  const desc = `${title}. Histogram of ${fmt(COINS)} real coins. You: ${youV}, ${percentile(you.pct)} percentile${real ? `. Real coin: ${real.value}` : ""}.`;

  return (
    <div
      onClick={() => {
        if (live) skip.current = true;
      }}
      className={live ? "cursor-pointer" : undefined}
    >
      <RampStats live={live} dist={dist} metric={dist.metric} />
      <div
        className="relative"
        style={{ width: u(PW), aspectRatio: `${PW} / ${PH}`, marginLeft: "auto", marginRight: "auto", borderRadius: u(22), background: "rgb(12 20 48 / 0.9)" }}
      >
        <svg viewBox={`0 0 ${PW} ${PH}`} className="absolute inset-0 block h-full w-full" role="img" aria-label={desc}>
          {zone && (
            <rect
              x={hx(zone.lo) - bw / 2}
              y={HTOP - 20}
              width={hx(zone.hi) - hx(zone.lo) + bw}
              height={HBASE - HTOP + 20}
              rx={10}
              fill={V.mint}
              fillOpacity={0.1}
            />
          )}
          {Array.from({ length: bins }, (_, b) => {
            const v = lo + b;
            const h = live ? 0 : barH(v);
            return (
              <rect
                key={v}
                ref={(el) => {
                  rects.current[b] = el;
                }}
                x={HX0 + b * bw + 1}
                y={HBASE - h}
                width={Math.max(bw - 2, 1)}
                height={h}
                fill={dist.flagged[v] ? V.slate : V.mint}
              />
            );
          })}
          <line x1={HX0} x2={HX1} y1={HBASE} y2={HBASE} stroke={V.axis} strokeWidth={3} />
          {labels.map((v) => (
            <g key={v}>
              <line x1={hx(v)} x2={hx(v)} y1={HBASE} y2={HBASE + 12} stroke={V.axis} strokeWidth={3} />
              <text x={hx(v)} y={HBASE + 50} textAnchor="middle" fontSize={26} fontWeight={600} fill={V.muted} style={FONT}>
                {v}
              </text>
            </g>
          ))}
          <text x={PW / 2} y={HBASE + 92} textAnchor="middle" fontSize={26} fontWeight={600} fill={V.muted} style={FONT}>
            {title.toUpperCase()}
          </text>
          {marks && real && (
            <line
              x1={realX}
              x2={realX}
              y1={realY + 24}
              y2={HBASE}
              stroke={toneOf(realTone)}
              strokeWidth={4}
              strokeDasharray="12 9"
              className="animate-pop"
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%", animationDelay: "120ms" }}
            />
          )}
          {marks && (
            <line
              x1={youX}
              x2={youX}
              y1={youY + 24}
              y2={HBASE}
              stroke={toneOf(youTone)}
              strokeWidth={4}
              strokeDasharray="12 9"
              className="animate-pop"
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
            />
          )}
        </svg>
        {marks && zone && (
          <Spot x={(hx(zone.lo) + hx(zone.hi)) / 2} y={HTOP - 88}>
            <VPill color={V.mint} size={24}>
              {Math.round(zone.share * 100)}% of real coins: {zone.lo}–{zone.hi}
            </VPill>
          </Spot>
        )}
        {marks && odds > 0 && odds < 1 && (
          <Spot x={calloutX} y={HBASE - 240} delay={380}>
            <VPill color={V.coral} size={30}>
              ≈ 1 in {oneIn(odds)}
            </VPill>
          </Spot>
        )}
        {marks && real && (
          <Spot x={pillX(realX)} y={realY} delay={120}>
            <VPill color={toneOf(realTone)} size={28}>
              REAL · {real.value}
              {arrow(real.value)}
            </VPill>
          </Spot>
        )}
        {marks && (
          <Spot x={pillX(youX)} y={youY}>
            <VPill color={toneOf(youTone)} size={28}>
              YOU · {youV}
              {arrow(youV)}
            </VPill>
          </Spot>
        )}
      </div>
    </div>
  );
}
