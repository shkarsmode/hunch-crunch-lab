"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Side } from "./engine";
import { faceOf, haptic, spin } from "./fx";
import { ResetIcon, UndoIcon } from "./Parts";
import { EXTRA, SEMI, V } from "./scene";

const ghost = "flex h-11 items-center gap-2 rounded-full bg-[#0C1430]/80 px-4 text-sm ring-1 ring-[#A9B6D3]/30 transition active:scale-95 disabled:opacity-35 enabled:hover:brightness-125";

type Props = {
  paused: boolean;
  canUndo: boolean;
  onFlip: (side: Side, from: DOMRect) => void;
  onUndo: () => void;
  onClear: () => void;
};

function CoinButton({
  side,
  onTap,
  btnRef,
  faceRef,
}: {
  side: Side;
  onTap: () => void;
  btnRef: (el: HTMLButtonElement | null) => void;
  faceRef: (el: HTMLSpanElement | null) => void;
}) {
  const heads = side === "H";
  return (
    <div className="flex flex-col items-center gap-3.5">
      <div style={{ perspective: "700px" }}>
        <button
          ref={btnRef}
          type="button"
          aria-label={heads ? "Heads" : "Tails"}
          onPointerDown={(e) => {
            if (e.button === 0) onTap();
          }}
          onClick={(e) => {
            if (e.detail === 0) onTap();
          }}
          className="group relative block size-[var(--coin)] cursor-pointer touch-none select-none rounded-full outline-none [-webkit-touch-callout:none] focus-visible:ring-4 focus-visible:ring-white/70"
        >
          <span aria-hidden className="absolute inset-0 rounded-full bg-black/35" style={{ transform: "translateY(14%)", filter: "blur(calc(var(--coin) * 0.088))" }} />
          <span
            ref={faceRef}
            aria-hidden
            className="absolute inset-0 grid place-items-center rounded-full motion-reduce:group-active:translate-y-2"
            style={{ background: faceOf(side) }}
          >
            <span style={{ ...EXTRA, fontSize: "calc(var(--coin) * 0.575)", lineHeight: 1, color: V.ink, paddingTop: "calc(var(--coin) * 0.03)" }}>{side}</span>
          </span>
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ ...SEMI, color: V.muted }}>
        {heads ? "Heads" : "Tails"}
        <kbd
          className="hidden rounded-md px-1.5 py-0.5 font-sans text-[10px] tracking-normal [@media(hover:hover)]:inline-block"
          style={{ ...SEMI, color: V.muted, border: "1px solid rgb(141 154 184 / 0.4)" }}
        >
          {side}
        </kbd>
      </div>
    </div>
  );
}

export default function CoinPad({ paused, canUndo, onFlip, onUndo, onClear }: Props) {
  const btns = useRef<Record<Side, HTMLButtonElement | null>>({ H: null, T: null });
  const faces = useRef<Record<Side, HTMLSpanElement | null>>({ H: null, T: null });

  const flip = useCallback(
    (side: Side) => {
      const btn = btns.current[side];
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      haptic();
      spin(faces.current[side]);
      onFlip(side, rect);
    },
    [onFlip],
  );

  const undo = useCallback(() => {
    haptic();
    onUndo();
  }, [onUndo]);

  useEffect(() => {
    if (paused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const k = e.key.toLowerCase();
      if (k === "h") {
        e.preventDefault();
        flip("H");
      } else if (k === "t") {
        e.preventDefault();
        flip("T");
      } else if (k === "backspace") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, flip, undo]);

  return (
    <div className="mx-auto w-full max-w-md [--coin:min(42vw,176px,26dvh)] [@media(max-height:479px)]:[--coin:min(42vw,176px,20dvh)]">
      <div className="flex items-start justify-center gap-5 sm:gap-8">
        <CoinButton
          side="H"
          onTap={() => flip("H")}
          btnRef={(el) => {
            btns.current.H = el;
          }}
          faceRef={(el) => {
            faces.current.H = el;
          }}
        />
        <CoinButton
          side="T"
          onTap={() => flip("T")}
          btnRef={(el) => {
            btns.current.T = el;
          }}
          faceRef={(el) => {
            faces.current.T = el;
          }}
        />
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <button type="button" onClick={undo} disabled={!canUndo} className={ghost} style={{ ...SEMI, color: V.muted }}>
          <UndoIcon />
          Undo
        </button>
        <button type="button" onClick={onClear} disabled={!canUndo} className={ghost} style={{ ...SEMI, color: V.muted }}>
          <ResetIcon />
          Start over
        </button>
      </div>
    </div>
  );
}
