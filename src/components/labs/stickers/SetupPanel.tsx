"use client";

import { useState, type ReactNode } from "react";
import { Locked, useAccess } from "@/components/access/AccessProvider";
import { ALBUM_PRESETS, FREE_CONFIG, LIMITS, VIDEO, fmt, sanitize, tap, type Config, type RareEvery } from "./config";

type Props = {
  config: Config;
  onApply: (c: Config) => void;
  onSim: () => void;
};

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-mist">{title}</h3>
        {hint && <span className="text-[11px] text-mist/80">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className={`grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-navy-950/55 p-1 ring-1 ring-edge/20`}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          aria-pressed={value === o.v}
          onClick={() => {
            tap();
            onChange(o.v);
          }}
          className={`h-11 rounded-xl px-1 text-[13px] font-bold transition active:scale-95 ${value === o.v ? "bg-ink text-navy-950" : "text-mist"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function SetupPanel({ config, onApply, onSim }: Props) {
  const { unlocked } = useAccess();
  const [draft, setDraft] = useState<Config>(unlocked ? config : FREE_CONFIG);
  const shown = unlocked ? draft : FREE_CONFIG;
  const patch = (p: Partial<Config>) => setDraft((d) => ({ ...d, ...p }));
  const isVideo = shown.n === VIDEO.n && shown.k === VIDEO.k;

  return (
    <div className="space-y-4 pb-1 text-sm">
      <Section title="Album size" hint={`${fmt(shown.n)} stickers`}>
        <Locked label="Albums up to 980 stickers">
          <div className="rounded-2xl bg-navy-950/55 p-2.5 ring-1 ring-edge/20">
            <div className="flex flex-wrap gap-1.5">
              {ALBUM_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={shown.n === n}
                  onClick={() => {
                    tap();
                    patch({ n });
                  }}
                  className={`h-11 min-w-[44px] flex-1 rounded-xl px-1 text-[13px] font-bold transition active:scale-95 ${shown.n === n ? "bg-ink text-navy-950" : "bg-navy-800/70 text-mist"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="range"
              aria-label="Album size"
              min={LIMITS.nMin}
              max={LIMITS.nMax}
              step={LIMITS.nStep}
              value={shown.n}
              onChange={(e) => patch({ n: Number(e.target.value) })}
              className="mt-2 h-11 w-full"
            />
          </div>
        </Locked>
      </Section>

      <Section title="Stickers per pack" hint={isVideo ? "like the video" : undefined}>
        <Locked label="Pack size">
          <div className="flex items-center gap-2 rounded-2xl bg-navy-950/55 p-1.5 ring-1 ring-edge/20">
            <button
              type="button"
              aria-label="Fewer stickers per pack"
              onClick={() => {
                tap();
                patch({ k: Math.max(LIMITS.kMin, shown.k - 1) });
              }}
              className="grid h-11 w-12 place-items-center rounded-xl bg-navy-800/70 text-xl font-black text-ink transition active:scale-95"
            >
              −
            </button>
            <p className="display num flex-1 text-center text-2xl font-black text-gold">{shown.k}</p>
            <button
              type="button"
              aria-label="More stickers per pack"
              onClick={() => {
                tap();
                patch({ k: Math.min(LIMITS.kMax, shown.k + 1) });
              }}
              className="grid h-11 w-12 place-items-center rounded-xl bg-navy-800/70 text-xl font-black text-ink transition active:scale-95"
            >
              +
            </button>
          </div>
        </Locked>
      </Section>

      <Section title="Rare stickers" hint="5× less often">
        <Locked label="Rare stickers">
          <Seg<RareEvery>
            label="Rare stickers"
            value={shown.rareEvery}
            onChange={(v) => patch({ rareEvery: v })}
            options={[
              { v: 0, label: "None" },
              { v: 10, label: "Every 10th" },
              { v: 5, label: "Every 5th" },
            ]}
          />
        </Locked>
      </Section>

      <Section title="Swap with friends" hint="trade doubles one for one">
        <Locked label="Swap with friends">
          <Seg<number>
            label="Friends"
            value={shown.friends}
            onChange={(v) => patch({ friends: v })}
            options={[0, 1, 2, 3, 4, 5].map((v) => ({ v, label: v === 0 ? "Off" : String(v) }))}
          />
        </Locked>
      </Section>

      <Locked label="The 10,000-album simulator">
        <button
          type="button"
          onClick={() => {
            tap();
            onSim();
          }}
          className={`flex h-14 w-full flex-col items-start justify-center rounded-2xl bg-navy-950/55 px-4 text-left ring-1 ring-edge/20 transition active:scale-[0.98]`}
        >
          <span className="font-bold">10,000 collectors</span>
          <span className="text-xs font-semibold text-mist">Histogram and swap test</span>
        </button>
      </Locked>

      <div className="sticky bottom-0 -mx-4 space-y-2 bg-gradient-to-t from-navy-850 from-75% to-navy-850/0 px-4 pb-1 pt-6">
        {unlocked && (
          <button
            type="button"
            onClick={() => {
              tap();
              setDraft({ n: VIDEO.n, k: VIDEO.k, rareEvery: 0, friends: 0 });
            }}
            className="h-11 w-full rounded-2xl text-[13px] font-bold text-cyan ring-1 ring-cyan/35 transition active:scale-[0.98]"
          >
            Use the video&apos;s album: {VIDEO.n} stickers, {VIDEO.k} per pack
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            tap();
            onApply(unlocked ? sanitize(draft) : FREE_CONFIG);
          }}
          className="h-12 w-full rounded-2xl bg-gold text-base font-black text-navy-950 shadow-[0_0_28px_-8px_#ffc94a] transition active:scale-[0.98]"
        >
          Start a new album
        </button>
      </div>
    </div>
  );
}
