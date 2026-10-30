"use client";

import { Locked, useAccess } from "@/components/access/AccessProvider";
import { COINS, FLIP_COUNTS, LEVELS, fmt, levelInfo } from "./engine";
import type { FlipCount, Level } from "./engine";

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  reserve = false,
}: {
  label: string;
  options: readonly { id: T; text: string }[];
  value: T;
  onChange: (v: T) => void;
  reserve?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`grid auto-cols-fr grid-flow-col gap-1.5 rounded-2xl bg-navy-900/60 p-1 ring-1 ring-edge/20 ${reserve ? "pr-[4.25rem]" : ""}`}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={`h-11 rounded-xl text-sm font-bold transition active:scale-95 ${o.id === value ? "bg-gold text-navy-950" : "text-mist hover:text-ink"}`}
        >
          {o.text}
        </button>
      ))}
    </div>
  );
}

const heading = "mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist";

export default function SettingsPanel({ n, level, open, onPick }: { n: FlipCount; level: Level; open: boolean; onPick: (n: FlipCount, level: Level) => void }) {
  const { unlocked } = useAccess();
  return (
    <div className="space-y-5 pb-2" inert={!open}>
      <section>
        <h3 className={heading}>Flips per round</h3>
        <Locked label="Any number of flips">
          <Segmented
            label="Flips per round"
            options={FLIP_COUNTS.map((v) => ({ id: v, text: String(v) }))}
            value={n}
            onChange={(v) => onPick(v, level)}
            reserve={!unlocked}
          />
        </Locked>
        <p className="mt-2 text-xs leading-snug text-mist">More flips give the detector more to go on. The video used 100.</p>
      </section>
      <section>
        <h3 className={heading}>Detector strictness</h3>
        <Locked label="Detector strictness">
          <Segmented
            label="Detector strictness"
            options={LEVELS.map((l) => ({ id: l.id, text: l.label }))}
            value={level}
            onChange={(v) => onPick(n, v)}
            reserve={!unlocked}
          />
        </Locked>
        <p className="mt-2 text-xs leading-snug text-mist">{levelInfo(level).blurb}</p>
      </section>
      <p className="rounded-2xl bg-navy-900/50 p-3 text-xs leading-snug text-mist ring-1 ring-edge/15">
        Each round flips {fmt(COINS)} real coins in your browser, with as many flips as you typed. The detector looks at two things: how often a sequence switches sides, and its longest streak. Changing a setting starts a new round.
      </p>
    </div>
  );
}
