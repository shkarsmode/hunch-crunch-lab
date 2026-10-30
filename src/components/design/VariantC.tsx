"use client";

import { useState } from "react";
import AntsPreview from "@/components/labs/ants/AntsPreview";
import Emblem from "@/components/ui/Emblem";
import { AntsThumb, CoinThumb, Icon, LAB, PRESETS, PackThumb, SPEEDS, UNLOCKS, fmt, useAntsControls, useAntsStep } from "@/components/design/parts";
import { TIERS } from "@/lib/tiers";

const ANT = ["#3FD2FF", "#FF4FD8"];
const TABS = ["Play", "Rules", "Presets"] as const;

function Corners() {
  return (
    <>
      {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-l border-b", "right-0 bottom-0 border-r border-b"].map((p) => (
        <span key={p} className={`pointer-events-none absolute h-3.5 w-3.5 border-white/60 ${p}`} />
      ))}
    </>
  );
}

export default function VariantC() {
  const hero = useAntsStep();
  const live = useAntsStep();
  const c = useAntsControls();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Play");
  const [tier, setTier] = useState(1);

  return (
    <div className="min-h-full bg-[#0A0D18] pb-16 text-[#F4F6FB]">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-[#0A0D18]/85 px-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-[13px] font-black tracking-[0.2em]">
          HUNCH CRUNCH <span className="rounded-[3px] bg-[#FFC94A] px-1 py-px text-[10px] tracking-[0.1em] text-[#0A0D18]">LAB</span>
        </div>
        <button type="button" aria-label="Menu" className="grid h-10 w-10 place-items-center rounded-full text-white/80 transition hover:bg-white/5 active:scale-95">
          <Icon.Menu size={22} />
        </button>
      </header>

      <section className="px-5 pt-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">E030 · Two ants</div>
        <div className="enter mt-2 text-[92px] font-black leading-[0.86] tracking-[-0.06em] text-[#FFC94A] tabular-nums" style={{ fontVariationSettings: '"opsz" 32' }}>
          84,876
        </div>
        <p className="enter mt-3 max-w-[30ch] text-[19px] font-medium leading-snug text-white/80" style={{ animationDelay: "80ms" }}>
          steps until two ants wipe the whole grid clean. Watch it happen.
        </p>
        <div className="enter relative mt-6 h-[250px]" style={{ animationDelay: "140ms" }}>
          <AntsPreview className="h-full w-full" onStep={hero.onStep} warm={2600} />
          <Corners />
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
          <span>Fig. 1 — live, same setup as the video</span>
          <span className="tabular-nums text-white/70">{fmt(hero.step)}</span>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button type="button" className="flex h-[52px] items-center gap-2 rounded-full bg-white px-6 text-[15px] font-bold text-[#0A0D18] transition hover:bg-[#FFC94A] active:scale-[0.98]">
            Play it yourself <Icon.Arrow size={18} />
          </button>
          <button type="button" className="flex items-center gap-1 text-[15px] font-bold text-white/80 underline decoration-white/30 underline-offset-[6px] transition hover:decoration-white">
            Watch the Short <Icon.Out size={16} />
          </button>
        </div>
      </section>

      <section className="pt-14">
        <div className="flex items-baseline justify-between border-b border-white/10 px-5 pb-3">
          <h2 className="text-[30px] font-black tracking-[-0.04em]">The lab</h2>
          <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/40">3 live · 5 soon</span>
        </div>
        {LAB.map((e, i) => (
          <button key={e.slug} type="button" className="group relative flex w-full gap-4 border-b border-white/10 px-5 py-6 text-left transition hover:bg-white/[0.02]">
            <span className="absolute inset-y-6 left-0 w-[3px] origin-top scale-y-50 transition duration-300 group-hover:scale-y-100" style={{ background: e.accent }} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-black tabular-nums text-white/30">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="mt-1 text-[24px] font-black leading-[1.05] tracking-[-0.03em]">{e.title}</h3>
              <p className="mt-2 text-[15px] leading-snug text-white/60">{e.hook}</p>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em]">
                <span className="text-[#3EE6A0]">Free</span> <span className="text-white/45">{e.free}</span>
              </div>
            </div>
            <div className="grid h-20 w-20 shrink-0 place-items-center self-center rounded-2xl" style={{ background: `${e.accent}14`, boxShadow: `inset 0 0 0 1px ${e.accent}33` }}>
              {i === 0 ? <AntsThumb className="h-14 w-14" cell={2.1} /> : i === 1 ? <CoinThumb size={46} /> : <PackThumb size={62} />}
            </div>
          </button>
        ))}
      </section>

      <section className="px-5 pt-14">
        <h2 className="text-[30px] font-black tracking-[-0.04em]">At the controls</h2>
        <div className="relative mt-4 h-[240px]">
          <AntsPreview className="h-full w-full" onStep={live.onStep} {...c.preview} />
          <Corners />
        </div>
        <div className="relative mt-4 grid grid-cols-3 border-b border-white/10">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`pb-3 text-[13px] font-black uppercase tracking-[0.16em] transition ${tab === t ? "text-white" : "text-white/35"}`}>
              {t}
            </button>
          ))}
          <span className="absolute -bottom-px left-0 h-[2px] w-1/3 bg-[#FFC94A] transition-transform duration-300 ease-out" style={{ transform: `translateX(${TABS.indexOf(tab) * 100}%)` }} />
        </div>
        <div className="min-h-[190px] pt-5">
          {tab === "Play" && (
            <div className="enter">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">Step</div>
                  <div className="text-[44px] font-black leading-none tracking-[-0.04em] tabular-nums">{fmt(live.step)}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={c.step} aria-label="One step" className="grid h-12 w-12 place-items-center rounded-full border border-white/15 transition active:scale-95">
                    <Icon.Step size={18} />
                  </button>
                  <button type="button" onClick={c.toggle} aria-label={c.playing ? "Pause" : "Play"} className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#0A0D18] transition active:scale-95">
                    {c.playing ? <Icon.Pause size={18} /> : <Icon.Play size={18} />}
                  </button>
                </div>
              </div>
              <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">Speed, steps a second</div>
              <input
                type="range"
                min={0}
                max={SPEEDS.length - 1}
                step={1}
                value={c.speed}
                onChange={(e) => c.setSpeed(Number(e.target.value))}
                className="mt-3 w-full"
                aria-label="Speed"
              />
              <div className="mt-1 flex justify-between text-[12px] font-bold tabular-nums">
                {SPEEDS.map((s, i) => (
                  <span key={s.label} className={c.speed === i ? "text-[#FFC94A]" : "text-white/35"}>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          {tab === "Rules" && (
            <div className="enter space-y-3">
              {c.rules.map((r, a) => (
                <div key={a} className="flex items-center gap-4 border-b border-white/10 pb-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: ANT[a], boxShadow: `0 0 10px ${ANT[a]}` }} />
                  <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/50">Ant {a + 1}</span>
                  <div className="ml-auto flex gap-2">
                    {r.split("").map((ch, p) => (
                      <button key={`${p}${ch}`} type="button" onClick={() => c.flip(a, p)} className="flip-in grid h-12 w-12 place-items-center rounded-xl border border-white/15 text-[22px] font-black transition active:scale-95">
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[13px] text-white/45">First letter: the turn on an empty square. Second: the turn on a filled one. Tap to flip.</p>
            </div>
          )}
          {tab === "Presets" && (
            <div className="enter grid grid-cols-2 gap-x-6">
              {PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => (p.locked ? c.locked("Presets") : c.restart())}
                  className="flex items-center justify-between border-b border-white/10 py-3 text-left text-[15px] font-bold"
                >
                  <span className={i === 0 ? "text-[#FFC94A]" : "text-white/75"}>{p.name}</span>
                  {p.locked ? <Icon.Lock size={14} className="text-white/35" /> : <Icon.Check size={16} className="text-[#FFC94A]" />}
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 h-4 text-[12px] font-bold uppercase tracking-[0.12em] text-[#FF5C7A]">{c.hint}</p>
        </div>
      </section>

      <section className="px-5 pt-12">
        <h2 className="text-[30px] font-black tracking-[-0.04em]">Stay, and it shows</h2>
        <p className="mt-2 text-[15px] text-white/60">One price, five badges. Each one is earned by months, not money.</p>
        <div className="relative mt-6">
          <div className="absolute bottom-10 left-[27px] top-10 w-px bg-white/10" />
          <div className="absolute left-[27px] top-10 w-px bg-[#FFC94A] transition-all duration-500" style={{ height: `${(tier / (TIERS.length - 1)) * 100}%`, maxHeight: "calc(100% - 80px)" }} />
          {TIERS.map((t, i) => (
            <button key={t.id} type="button" onClick={() => setTier(i)} className="relative flex w-full items-center gap-4 py-3 text-left">
              <div className="w-14 shrink-0 text-center">
                <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#0A0D18] text-[22px] font-black tabular-nums ring-1 transition ${i <= tier ? "text-[#FFC94A] ring-[#FFC94A]/50" : "text-white/30 ring-white/10"}`}>
                  {t.months}
                </div>
              </div>
              <Emblem tier={t.id} size={64} muted={i > tier} />
              <div className="min-w-0">
                <div className={`text-[17px] font-black tracking-[-0.02em] ${i <= tier ? "" : "text-white/45"}`}>{t.name}</div>
                <div className="text-[13px] leading-snug text-white/45">{t.line}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-5 mt-12 border-t border-white/15 pt-8">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFC94A]">Full lab · $3 a month</div>
        <h2 className="mt-3 text-[34px] font-black leading-[1.0] tracking-[-0.045em]">Support the lab. Get all of it.</h2>
        <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
          {UNLOCKS.map((u, i) => (
            <li key={u} className="flex items-center gap-4 py-3 text-[15px] font-semibold text-white/80">
              <span className="w-6 text-[13px] font-black tabular-nums text-white/30">{String(i + 1).padStart(2, "0")}</span>
              {u}
            </li>
          ))}
        </ul>
        <button type="button" className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#FFC94A] text-[15px] font-black text-[#0A0D18] transition active:scale-[0.98]">
          Join on Patreon <Icon.Out size={18} />
        </button>
      </section>

      <p className="mt-12 px-5 text-[12px] font-bold uppercase tracking-[0.18em] text-white/25">Every simulation here is our own code.</p>
    </div>
  );
}
