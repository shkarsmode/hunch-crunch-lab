"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode, type Ref } from "react";
import Crunchy, { type CrunchyMood } from "@/components/Crunchy";
import { fmt } from "./config";
import { ALBUM_VH, ALBUM_VW, ALBUM_X, ALBUM_Y, type Visual } from "./director";
import PackArt from "./PackArt";
import {
  ALBUM,
  BASELINE,
  CAP_Y,
  CARD,
  CORAL,
  COUNT_X,
  CRUNCHY,
  DISPLAY,
  GOLD,
  GRID,
  INK,
  LABEL,
  MINT,
  MUTED,
  PACK,
  PANEL,
  PANEL_LINE,
  PILE,
  PILE_TILE,
  PILL_Y,
  PRICE,
  VH,
  VW,
  WHITE,
  Y0,
  captionSize,
  parseCaption,
  plain,
  rgba,
  shadow,
} from "./video";

export type PillSpec = { text: string; color: string };

export type CaptionSpec = { markup: string; hold: number; n: number };

type TProps = {
  x: number;
  y: number;
  size: number;
  color: string;
  display?: boolean;
  align?: "c" | "l" | "r";
  local?: boolean;
  children: ReactNode;
};

function T({ x, y, size, color, display = true, align = "c", local = false, children }: TProps) {
  const dx = align === "c" ? "-50%" : align === "r" ? "-100%" : "0%";
  const style: CSSProperties = {
    position: "absolute",
    left: x,
    top: local ? y : y - Y0,
    fontSize: size,
    lineHeight: 1,
    whiteSpace: "nowrap",
    color,
    transform: `translate(${dx}, -${BASELINE * 100}%)`,
    textShadow: shadow(size),
    fontVariantNumeric: "tabular-nums",
    ...(display ? DISPLAY : LABEL),
  };
  return <div style={style}>{children}</div>;
}

function Pill({ size, color, children }: { size: number; color: string; children: ReactNode }) {
  const h = size * 1.55;
  return (
    <div
      className="animate-pop"
      style={{
        height: h,
        padding: `0 ${size * 0.55}px`,
        borderRadius: h / 2,
        background: rgba(color, 0.95),
        boxShadow: `0 0 20px ${rgba(color, 0.35)}`,
        color: INK,
        fontSize: size,
        lineHeight: `${h}px`,
        whiteSpace: "nowrap",
        animationDuration: "320ms",
        ...DISPLAY,
      }}
    >
      {children}
    </div>
  );
}

function pillSize(pills: PillSpec[]) {
  for (const size of [30, 26, 22]) {
    const total = pills.reduce((a, p) => a + p.text.length * 0.6 * size + size * 1.1, 0) + Math.max(0, pills.length - 1) * 18;
    if (total <= 930) return size;
  }
  return 20;
}

function Caption({ spec }: { spec: CaptionSpec }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (spec.hold <= 0) return;
    const t = window.setTimeout(() => setGone(true), spec.hold);
    return () => window.clearTimeout(t);
  }, [spec.hold]);
  const lines = parseCaption(spec.markup);
  const size = captionSize(spec.markup);
  const lh = size * 1.13;
  const first = CAP_Y - (lines.length - 1) * lh * 0.45;
  const offset = (lh - size * 1.21) / 2 + size * 0.96875;
  let index = 0;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        width: VW,
        top: first - Y0 - offset,
        fontSize: size,
        lineHeight: `${lh}px`,
        textAlign: "center",
        opacity: gone ? 0 : 1,
        transform: gone ? "translateY(-40px)" : "none",
        transition: "opacity 220ms ease-in, transform 220ms ease-in",
        pointerEvents: "none",
        ...DISPLAY,
      }}
    >
      {lines.map((words, li) => (
        <div key={li} style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", maxWidth: 930, margin: "0 auto" }}>
          {words.map((w, wi) => {
            const i = index++;
            return (
              <span
                key={wi}
                className="animate-pop"
                style={{
                  display: "inline-block",
                  color: w.color,
                  marginLeft: wi === 0 || w.glue ? 0 : size * 0.27,
                  textShadow: shadow(size, 0.6),
                  animationDelay: `${i * 45}ms`,
                  animationDuration: "300ms",
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

type SceneProps = {
  s: number;
  ready: boolean;
  stageRef: Ref<HTMLDivElement>;
  albumRef: Ref<HTMLCanvasElement>;
  packRef: Ref<HTMLDivElement>;
  n: number;
  k: number;
  vis: Visual;
  mood: CrunchyMood;
  bump: number;
  caption: CaptionSpec | null;
  banner: { text: string; n: number } | null;
  pills: PillSpec[];
  done: number | null;
  onPack: () => void;
  onInspect: (e: MouseEvent<HTMLCanvasElement>) => void;
};

export default function Scene({ s, ready, stageRef, albumRef, packRef, n, k, vis, mood, bump, caption, banner, pills, done, onPack, onInspect }: SceneProps) {
  const pct = n > 0 ? vis.owned / n : 0;
  const filled = `${(pct * 100).toFixed(1)}%`;
  const bricks = Math.min(18, Math.floor(vis.doubles / 3));
  const psize = pillSize(pills);
  const header = vis.owned > 0 ? `ALBUM · ${fmt(vis.owned)} / ${fmt(n)} STICKERS` : `ALBUM · ${fmt(n)} STICKERS`;
  return (
    <div style={{ width: VW * s, height: VH * s, opacity: ready ? 1 : 0, transition: "opacity 200ms" }} className="relative shrink-0">
      <div ref={stageRef} style={{ position: "absolute", left: 0, top: 0, width: VW, height: VH, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: VW, height: 640 - Y0, background: "linear-gradient(180deg, rgba(7,11,23,0.647), rgba(7,11,23,0))" }} />

        {caption && <Caption key={`caption-${caption.n}`} spec={caption} />}
        <div className="sr-only" aria-live="polite">
          {caption ? plain(caption.markup) : ""}
        </div>

        <div style={{ position: "absolute", left: 0, width: VW, top: PILL_Y - Y0 - 24, height: 48, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
          {pills.map((p) => (
            <Pill key={p.text} size={psize} color={p.color}>
              {p.text}
            </Pill>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: ALBUM.x,
            top: ALBUM.y - Y0,
            width: ALBUM.w,
            height: ALBUM.h,
            borderRadius: ALBUM.r,
            background: PANEL,
            border: `3px solid ${PANEL_LINE}`,
            boxSizing: "border-box",
            boxShadow: "0 0 48px rgba(0,0,0,0.45)",
          }}
        />
        <T x={540} y={578} size={26} color={MUTED} display={false}>
          {header}
        </T>
        <div
          role="progressbar"
          aria-label="Album progress"
          aria-valuemin={0}
          aria-valuemax={n}
          aria-valuenow={vis.owned}
          style={{ position: "absolute", left: GRID.x, top: 586 - Y0, width: GRID.w, height: 6, borderRadius: 3, background: rgba(PANEL_LINE, 0.35) }}
        >
          <div style={{ width: `${(pct * 100).toFixed(2)}%`, height: "100%", borderRadius: 3, background: MINT, transition: "width 200ms ease-out" }} />
        </div>
        <canvas
          ref={albumRef}
          onClick={onInspect}
          role="img"
          aria-label={`Sticker album: ${vis.owned} of ${n} stickers collected`}
          style={{ position: "absolute", left: ALBUM_X, top: ALBUM_Y - Y0, width: ALBUM_VW, height: ALBUM_VH, cursor: "pointer", touchAction: "manipulation" }}
        />

        {done === null && (
          <button
            type="button"
            onClick={onPack}
            aria-label="Rip a pack"
            style={{ position: "absolute", left: PACK.x - 105, top: PACK.y - Y0 - 105, width: 210, height: 210, background: "transparent", border: 0, padding: 0, touchAction: "manipulation" }}
          >
            <div ref={packRef} style={{ position: "absolute", left: 105 - PACK.w / 2, top: 105 - PACK.h / 2, width: PACK.w, height: PACK.h }}>
              <PackArt k={k} />
            </div>
          </button>
        )}

        <div key={`crunchy-${bump}`} className="animate-crunch" style={{ position: "absolute", left: CRUNCHY.x - 90, top: CRUNCHY.y - 90 - Y0, width: 180, height: 189 }}>
          <Crunchy size={180} mood={done !== null ? "grin" : mood} look={{ x: 0.6, y: 0.2 }} />
        </div>

        {Array.from({ length: bricks }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: PILE.x - 60 + (i % 6) * 20,
              top: PILE.y - 14 - Math.floor(i / 6) * 9 + ((i * 37) % 5) - Y0,
              width: 22,
              height: 22,
              borderRadius: 4,
              background: PILE_TILE,
            }}
          />
        ))}
        <T x={PILE.x} y={PILE.y + 40} size={44} color={CORAL}>
          {fmt(vis.doubles)}
        </T>
        <T x={PILE.x} y={PILE.y + 78} size={24} color={MUTED} display={false}>
          DOUBLES
        </T>

        <T x={COUNT_X[0]} y={462} size={28} color={MUTED} display={false}>
          PACKS
        </T>
        <T x={COUNT_X[0]} y={540} size={64} color={WHITE}>
          {fmt(vis.packs)}
        </T>
        <T x={COUNT_X[1]} y={462} size={28} color={MUTED} display={false}>
          SPENT
        </T>
        <T x={COUNT_X[1]} y={540} size={64} color={GOLD}>
          {`$${fmt(vis.packs * PRICE)}`}
        </T>
        <T x={COUNT_X[2]} y={462} size={28} color={MUTED} display={false}>
          FILLED
        </T>
        <T x={COUNT_X[2]} y={540} size={64} color={MINT}>
          {filled}
        </T>

        {banner && (
          <div key={`banner-${banner.n}`} className="animate-pop" style={{ position: "absolute", left: 0, width: VW, top: 960 - Y0 - 55, height: 110, pointerEvents: "none", animationDuration: "320ms" }}>
            <div style={{ position: "absolute", left: 230, top: 0, width: 620, height: 110, borderRadius: 30, background: "rgba(7,11,23,0.75)", filter: "blur(6px)" }} />
            <div style={{ position: "absolute", left: 0, width: VW, top: 55 - 29.5, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  height: 59,
                  padding: "0 21px",
                  borderRadius: 29.5,
                  background: rgba(CORAL, 0.95),
                  boxShadow: `0 0 20px ${rgba(CORAL, 0.35)}`,
                  color: INK,
                  fontSize: 38,
                  lineHeight: "59px",
                  whiteSpace: "nowrap",
                  ...DISPLAY,
                }}
              >
                {banner.text}
              </div>
            </div>
          </div>
        )}

        {done !== null && (
          <div
            className="animate-pop"
            style={{
              position: "absolute",
              left: 190,
              top: 810 - Y0,
              width: 700,
              height: 300,
              borderRadius: 40,
              background: rgba(CARD, 0.96),
              border: `3px solid ${rgba(GOLD, 0.9)}`,
              boxSizing: "border-box",
              boxShadow: "0 0 60px rgba(0,0,0,0.5)",
              animationDuration: "450ms",
            }}
          >
            <T x={347} y={72} size={34} color={MINT} display={false} local>
              ALBUM COMPLETE
            </T>
            <T x={347} y={167} size={92} color={WHITE} local>
              {`${fmt(done)} ${done === 1 ? "pack" : "packs"}`}
            </T>
            <T x={347} y={252} size={64} color={GOLD} local>
              {`$${fmt(done * PRICE)}`}
            </T>
          </div>
        )}
      </div>
    </div>
  );
}
