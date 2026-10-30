"use client";

import { useCallback, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icons";
import { btn } from "@/components/ui/kit";
import type { Side } from "./engine";
import { faceOf, haptic, spin } from "./fx";
import { UndoIcon } from "./Parts";
import { EXTRA, V } from "./scene";

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
      <div className="flex h-5 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
        {heads ? "Heads" : "Tails"}
        <kbd className="hidden rounded border border-hair-strong px-1.5 font-mono text-[10px] leading-4 tracking-normal text-ink/70 [@media(hover:hover)]:inline-block">{side}</kbd>
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
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={undo} disabled={!canUndo} className={btn("ghost", "md")}>
          <UndoIcon size={17} />
          Undo
        </button>
        <button type="button" onClick={onClear} disabled={!canUndo} className={btn("ghost", "md")}>
          <Icon.Reset size={17} />
          Start over
        </button>
      </div>
    </div>
  );
}
