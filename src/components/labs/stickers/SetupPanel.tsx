"use client";

import { useState, type ReactNode } from "react";
import { Locked, useAccess } from "@/components/access/AccessProvider";
import { Icon } from "@/components/ui/icons";
import { btn } from "@/components/ui/kit";
import { Seg } from "./Controls";
import { ALBUM_PRESETS, FREE_CONFIG, LIMITS, VIDEO, fmt, sanitize, tap, type Config, type RareEvery } from "./config";

type Props = {
  config: Config;
  simOpen: boolean;
  onApply: (c: Config) => void;
  onSim: () => void;
};

const box = "rounded-xl border border-hair bg-white/[0.025]";
const step = "grid h-11 w-12 place-items-center rounded-lg text-ink/70 transition hover:bg-white/5 hover:text-ink active:scale-95";

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/40">{title}</h3>
        {hint && <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink/55">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export default function SetupPanel({ config, simOpen, onApply, onSim }: Props) {
  const { unlocked } = useAccess();
  const [draft, setDraft] = useState<Config>(unlocked ? config : FREE_CONFIG);
  const shown = unlocked ? draft : FREE_CONFIG;
  const patch = (p: Partial<Config>) => setDraft((d) => ({ ...d, ...p }));
  const isVideo = shown.n === VIDEO.n && shown.k === VIDEO.k;

  return (
    <div className="space-y-5 pb-1 text-[14px]">
      <Section title="Album size" hint={`${fmt(shown.n)} stickers`}>
        <Locked label="Albums up to 980 stickers">
          <div>
            <Seg<number>
              label="Album size presets"
              value={shown.n}
              onChange={(n) => {
                tap();
                patch({ n });
              }}
              options={ALBUM_PRESETS.map((n) => ({ v: n, label: String(n) }))}
            />
            <input
              type="range"
              aria-label="Album size"
              min={LIMITS.nMin}
              max={LIMITS.nMax}
              step={LIMITS.nStep}
              value={shown.n}
              onChange={(e) => patch({ n: Number(e.target.value) })}
              className="mt-1 block h-11 w-full touch-manipulation"
            />
          </div>
        </Locked>
      </Section>

      <Section title="Stickers per pack" hint={isVideo ? "like the video" : undefined}>
        <Locked label="Pack size">
          <div className={`flex items-center justify-between p-1 ${box}`}>
            <button
              type="button"
              aria-label="Fewer stickers per pack"
              onClick={() => {
                tap();
                patch({ k: Math.max(LIMITS.kMin, shown.k - 1) });
              }}
              className={step}
            >
              <Icon.Minus size={18} />
            </button>
            <p className="font-mono text-[20px] tabular-nums text-ink">{shown.k}</p>
            <button
              type="button"
              aria-label="More stickers per pack"
              onClick={() => {
                tap();
                patch({ k: Math.min(LIMITS.kMax, shown.k + 1) });
              }}
              className={step}
            >
              <Icon.Plus size={18} />
            </button>
          </div>
        </Locked>
      </Section>

      <Section title="Rare stickers" hint="5× less often">
        <Locked label="Rare stickers">
          <Seg<RareEvery>
            label="Rare stickers"
            value={shown.rareEvery}
            onChange={(v) => {
              tap();
              patch({ rareEvery: v });
            }}
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
            onChange={(v) => {
              tap();
              patch({ friends: v });
            }}
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
          data-sheet-trigger
          aria-expanded={simOpen}
          className={`flex h-14 w-full items-center gap-3 px-3.5 text-left transition hover:border-hair-strong active:scale-[0.99] ${box}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">10,000 collectors</span>
            <span className="block text-[12px] text-ink/45">Histogram and swap test</span>
          </span>
          <Icon.Chevron size={18} className="shrink-0 text-ink/35" />
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
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-hair-strong px-3 py-2 text-[13px] font-semibold leading-tight text-ink/85 transition hover:border-white/30 hover:text-ink active:scale-[0.98]"
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
          className={btn("primary", "lg", "w-full")}
        >
          Start a new album
        </button>
      </div>
    </div>
  );
}
