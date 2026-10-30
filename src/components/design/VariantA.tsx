"use client";

import { useState } from "react";
import AntsPreview from "@/components/labs/ants/AntsPreview";
import Crunchy from "@/components/Crunchy";
import Emblem from "@/components/design/Emblem";
import { AntsThumb, CoinThumb, Icon, LAB, PRESETS, PackThumb, SPEEDS, UNLOCKS, fmt, useAntsControls, useAntsStep } from "@/components/design/parts";
import { TIERS } from "@/lib/tiers";

const ANT = ["#3FD2FF", "#FF4FD8"];

function Label({ n, title, right }: { n: string; title: string; right?: string }) {
  return (
    <div className="mono flex items-center justify-between px-5 pb-3 pt-10 text-[11px] tracking-[0.08em] text-white/45">
      <span>
        <span className="text-white/25">{n}</span> &nbsp;{title.toUpperCase()}
      </span>
      {right && <span className="text-white/30">{right.toUpperCase()}</span>}
    </div>
  );
}

function Readout({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="mono rounded-md border border-white/10 bg-black/55 px-2 py-1 leading-tight backdrop-blur-md">
      <div className="text-[9px] tracking-[0.1em] text-white/45">{label}</div>
      <div className={`text-[13px] ${tone}`}>{value}</div>
    </div>
  );
}

export default function VariantA() {
  const hero = useAntsStep();
  const live = useAntsStep();
  const c = useAntsControls();
  const [tier, setTier] = useState(0);

  return (
    <div
      className="min-h-full bg-[#06080D] pb-16 text-[#F2F4F8]"
      style={{ backgroundImage: "radial-gradient(rgb(255 255 255 / 0.045) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
    >
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#06080D]/80 px-5 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <Crunchy size={24} shadow={false} />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">Hunch Crunch</span>
          <span className="mono rounded-[5px] border border-white/15 px-1.5 py-px text-[10px] text-white/55">LAB</span>
        </div>
        <button type="button" className="h-8 rounded-full border border-white/[0.12] px-3.5 text-[13px] font-medium text-white/80 transition hover:border-white/30 hover:text-white active:scale-[0.97]">
          Sign in
        </button>
      </header>

      <section className="pt-6">
        <div className="mono enter flex items-center gap-2 px-5 text-[11px] tracking-[0.08em] text-white/50">
          <span className="live-dot text-[#3FD2FF]" /> LIVE · E030 · TWO ANTS
        </div>
        <div className="enter relative mt-3 h-[300px] border-y border-white/[0.07]" style={{ animationDelay: "60ms" }}>
          <AntsPreview className="h-full w-full" onStep={hero.onStep} warm={2600} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#06080D] to-transparent" />
          <div className="absolute left-4 top-3 flex gap-1.5">
            <Readout label="STEP" value={fmt(hero.step)} />
            <Readout label="HOME AT" value="84,876" tone="text-[#FFC94A]" />
          </div>
          {hero.home && <div className="mono absolute right-4 top-3 rounded-md bg-[#3EE6A0]/15 px-2 py-1 text-[11px] text-[#3EE6A0] ring-1 ring-[#3EE6A0]/30">GRID CLEAN</div>}
        </div>
        <div className="px-5">
          <h1 className="enter mt-6 text-[42px] font-extrabold leading-[1.0] tracking-[-0.04em]" style={{ fontVariationSettings: '"opsz" 32', animationDelay: "120ms" }}>
            Got a hunch?
            <br />
            <span className="text-[#FFC94A]">Play it.</span>
          </h1>
          <p className="enter mt-3.5 max-w-[34ch] text-[15px] leading-relaxed text-white/55" style={{ animationDelay: "180ms" }}>
            The simulations from the Shorts, in your hands. Guess first, then run the real thing.
          </p>
          <div className="enter mt-6 flex gap-2.5" style={{ animationDelay: "240ms" }}>
            <button
              type="button"
              className="group flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#FFC94A] text-[15px] font-semibold text-[#0B0D12] shadow-[0_0_0_1px_rgb(255_201_74/0.45),0_12px_32px_-12px_rgb(255_201_74/0.6)] transition hover:bg-[#FFD36A] active:scale-[0.98]"
            >
              Play two ants <Icon.Arrow size={18} className="transition group-hover:translate-x-0.5" />
            </button>
            <button type="button" className="flex h-[52px] items-center gap-2 rounded-xl border border-white/[0.12] px-4 text-[15px] font-medium text-white/80 transition hover:border-white/30 active:scale-[0.98]">
              <Icon.Youtube size={18} /> Videos
            </button>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-3 divide-x divide-white/[0.07] border-y border-white/[0.07]">
          {LAB.map((e) => (
            <div key={e.slug} className="px-4 py-3.5">
              <div className="mono text-[17px] text-white">{e.fact}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-white/40">{e.factLine}</div>
            </div>
          ))}
        </div>
      </section>

      <Label n="01" title="The lab" right="3 experiments" />
      <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
        {LAB.map((e, i) => (
          <button key={e.slug} type="button" className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.025] active:bg-white/[0.05]">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-[#0C0F17]">
              {i === 0 ? <AntsThumb className="h-11 w-11" cell={1.7} /> : i === 1 ? <CoinThumb size={34} /> : <PackThumb size={46} />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[16px] font-semibold tracking-[-0.01em]">{e.title}</h3>
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white/45">{e.hook}</p>
              <div className="mono mt-2 flex gap-3 text-[10px] tracking-[0.07em]">
                <span className="text-[#3EE6A0]">FREE SETUP</span>
                <span className="text-white/30">+{e.unlocks} IN FULL LAB</span>
              </div>
            </div>
            <Icon.Chevron size={18} className="text-white/25" />
          </button>
        ))}
      </div>

      <Label n="02" title="Controls" right="two ants" />
      <div className="mx-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0D14]">
        <div className="relative h-[220px]">
          <AntsPreview className="h-full w-full" onStep={live.onStep} {...c.preview} />
          <div className="absolute left-3 top-3 flex gap-1.5">
            <Readout label="STEP" value={fmt(live.step)} />
            <Readout label="SPEED" value={SPEEDS[c.speed].rate ? `${SPEEDS[c.speed].label}/s` : "AUTO"} />
          </div>
          {!c.playing && <div className="mono absolute right-3 top-3 rounded-md bg-white/10 px-2 py-1 text-[10px] tracking-[0.1em] text-white/70">PAUSED</div>}
        </div>
        <div className="space-y-3 border-t border-white/[0.07] p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={c.toggle}
              aria-label={c.playing ? "Pause" : "Play"}
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition active:scale-95 ${c.playing ? "border border-white/[0.12] text-white" : "bg-[#FFC94A] text-[#0B0D12]"}`}
            >
              {c.playing ? <Icon.Pause size={18} /> : <Icon.Play size={18} />}
            </button>
            <button type="button" onClick={c.step} aria-label="One step" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/[0.12] text-white/80 transition active:scale-95">
              <Icon.Step size={18} />
            </button>
            <div className="relative grid h-12 flex-1 grid-cols-5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
              <div
                className="absolute inset-y-1 left-1 rounded-lg bg-white/[0.11] transition-transform duration-200 ease-out"
                style={{ width: "calc((100% - 8px) / 5)", transform: `translateX(${c.speed * 100}%)` }}
              />
              {SPEEDS.map((s, i) => (
                <button key={s.label} type="button" onClick={() => c.setSpeed(i)} className={`mono relative text-[11px] transition ${c.speed === i ? "text-white" : "text-white/45"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="mono w-12 text-[10px] tracking-[0.1em] text-white/40">RULES</span>
            {c.rules.map((r, a) => (
              <div key={a} className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
                <span className="mx-1 h-2 w-2 rounded-full" style={{ background: ANT[a], boxShadow: `0 0 8px ${ANT[a]}` }} />
                {r.split("").map((ch, p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => c.flip(a, p)}
                    className="mono grid h-9 w-9 place-items-center rounded-lg border border-white/[0.12] bg-[#121722] text-[13px] text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.45)] transition active:translate-y-px active:shadow-none"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            ))}
            <button type="button" onClick={() => c.locked("More ants")} aria-label="Add an ant" className="ml-auto grid h-11 w-11 place-items-center rounded-xl border border-dashed border-white/15 text-white/40 transition active:scale-95">
              <Icon.Plus size={16} />
            </button>
          </div>
          <div className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3">
            {PRESETS.map((p, i) => (
              <button
                key={p.name}
                type="button"
                onClick={() => (p.locked ? c.locked("Presets") : c.restart())}
                className={`mono flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[11px] transition active:scale-[0.97] ${i === 0 ? "bg-white text-[#0B0D12]" : "border border-white/[0.09] text-white/50"}`}
              >
                {p.locked && <Icon.Lock size={12} />} {p.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mono mt-2.5 h-4 px-5 text-[10px] tracking-[0.08em] text-white/35">{c.hint ? c.hint.toUpperCase() : "TAP A KEY TO FLIP A RULE. TAP + FOR MORE ANTS."}</p>

      <Label n="03" title="Supporter tiers" right="$3 / month" />
      <div className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-1">
        {TIERS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTier(i)}
            className={`w-[184px] shrink-0 snap-start rounded-2xl border p-4 text-left transition ${tier === i ? "border-[#FFC94A]/50 bg-[#FFC94A]/[0.04]" : "border-white/[0.08] bg-white/[0.015]"}`}
          >
            <Emblem tier={t.id} size={88} className="-ml-1" />
            <div className="mono mt-3 text-[10px] tracking-[0.1em] text-white/40">{String(t.months).padStart(2, "0")} {t.months === 1 ? "MONTH" : "MONTHS"}</div>
            <div className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">{t.name}</div>
            <div className="mt-1 text-[12px] leading-snug text-white/45">{t.line}</div>
          </button>
        ))}
      </div>
      <div className="mt-5 px-5">
        <div className="relative h-px bg-white/10">
          <div className="absolute inset-y-0 left-0 bg-[#FFC94A] transition-all duration-300" style={{ width: `${(tier / (TIERS.length - 1)) * 100}%` }} />
          {TIERS.map((t, i) => (
            <span
              key={t.id}
              className={`absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${i <= tier ? "bg-[#FFC94A]" : "bg-[#262C3A]"}`}
              style={{ left: `${(i / (TIERS.length - 1)) * 100}%` }}
            />
          ))}
        </div>
        <div className="mono mt-2.5 flex justify-between text-[10px] text-white/35">
          {TIERS.map((t) => (
            <span key={t.id}>{t.months}M</span>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-10 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-5">
        <div className="mono text-[11px] tracking-[0.08em] text-[#FFC94A]">FULL LAB · $3 / MONTH</div>
        <h2 className="mt-2 text-[24px] font-bold leading-tight tracking-[-0.03em]">Every rule, every speed, every game.</h2>
        <ul className="mt-4 space-y-2.5">
          {UNLOCKS.map((u) => (
            <li key={u} className="flex items-center gap-2.5 text-[14px] text-white/70">
              <Icon.Check size={16} className="text-[#3EE6A0]" /> {u}
            </li>
          ))}
        </ul>
        <button type="button" className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFC94A] text-[15px] font-semibold text-[#0B0D12] transition active:scale-[0.98]">
          Unlock on Patreon <Icon.Out size={18} />
        </button>
      </div>

      <p className="mono mt-12 px-5 text-center text-[10px] tracking-[0.12em] text-white/25">EVERY SIMULATION HERE IS OUR OWN CODE</p>
    </div>
  );
}
