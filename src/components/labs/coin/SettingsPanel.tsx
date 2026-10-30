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
  const index = Math.max(0, options.findIndex((o) => o.id === value));
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`relative grid auto-cols-fr grid-flow-col rounded-xl border border-hair bg-white/[0.03] p-1 ${reserve ? "pr-[4.25rem]" : ""}`}
    >
      <div
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-lg bg-white/[0.12] transition-transform duration-200 ease-out"
        style={{ width: `calc((100% - ${reserve ? "4px - 4.25rem" : "8px"}) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={`relative h-11 font-mono text-[12px] uppercase tracking-[0.08em] transition ${on ? "text-ink" : "text-ink/45 hover:text-ink/80"}`}
          >
            {o.text}
          </button>
        );
      })}
    </div>
  );
}

const heading = "mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/40";
const hint = "mt-2 text-[12px] leading-snug text-ink/45";

export default function SettingsPanel({ n, level, open, onPick }: { n: FlipCount; level: Level; open: boolean; onPick: (n: FlipCount, level: Level) => void }) {
  const { unlocked } = useAccess();
  return (
    <div className="space-y-5 pb-2 text-[14px]" inert={!open}>
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
        <p className={hint}>More flips give the detector more to go on. The video used 100.</p>
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
        <p className={hint}>{levelInfo(level).blurb}</p>
      </section>
      <p className="rounded-xl border border-hair bg-white/[0.025] p-3 text-[12px] leading-snug text-ink/50">
        Each round flips {fmt(COINS)} real coins in your browser, with as many flips as you typed. The detector looks at two things: how often a sequence switches sides, and its longest streak. Changing a setting starts a new round.
      </p>
    </div>
  );
}
