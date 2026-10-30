"use client";

import { useState } from "react";
import AntsPreview from "@/components/labs/ants/AntsPreview";
import Crunchy from "@/components/Crunchy";
import Emblem from "@/components/ui/Emblem";
import { AntsThumb, CoinThumb, Icon, LAB, PRESETS, PackThumb, SPEEDS, UNLOCKS, fmt, useAntsControls, useAntsStep } from "@/components/design/parts";
import { TIERS } from "@/lib/tiers";

const ANT = ["#3FD2FF", "#FF4FD8"];
const SPRING = "ease-[cubic-bezier(0.2,1.4,0.4,1)]";
const GOLD_BTN =
  "bg-[linear-gradient(180deg,#FFE08A_0%,#FFC94A_45%,#F2A92B_100%)] text-[#2A1A00] shadow-[0_18px_40px_-14px_rgb(255_170_40/0.75),inset_0_1px_0_rgb(255_255_255/0.65),inset_0_-3px_0_rgb(0_0_0/0.12)]";
const GLASS = "border border-white/[0.09] bg-white/[0.055] backdrop-blur-xl shadow-[0_24px_48px_-24px_rgb(0_0_0/0.7),inset_0_1px_0_rgb(255_255_255/0.08)]";

export default function VariantB() {
  const hero = useAntsStep();
  const live = useAntsStep();
  const c = useAntsControls();
  const [tier, setTier] = useState(0);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#0B1030] pb-16 text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#FFC94A]/25 blur-[90px]" />
      <div className="pointer-events-none absolute -right-28 top-72 h-96 w-96 rounded-full bg-[#3FE0FF]/20 blur-[100px]" />
      <div className="pointer-events-none absolute -left-20 top-[1200px] h-96 w-96 rounded-full bg-[#FF4FD8]/15 blur-[100px]" />

      <header className={`sticky top-3 z-20 mx-3 mt-3 flex h-14 items-center justify-between rounded-full pl-3 pr-2 ${GLASS}`}>
        <div className="flex items-center gap-2">
          <Crunchy size={30} shadow={false} mood="grin" />
          <span className="text-[16px] font-black tracking-[-0.02em]">Hunch Crunch</span>
        </div>
        <button type="button" className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-extrabold transition duration-300 active:scale-95 ${SPRING} ${GOLD_BTN}`}>
          <Icon.Spark size={15} /> Unlock
        </button>
      </header>

      <section className="relative px-4 pt-14">
        <div className="relative">
          <div className={`enter relative h-[300px] overflow-hidden rounded-[30px] ${GLASS} p-1.5`}>
            <AntsPreview className="h-full w-full rounded-[24px]" onStep={hero.onStep} warm={2600} />
            <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1.5 text-[12px] font-bold backdrop-blur-md">
              Step <span className="tabular-nums">{fmt(hero.step)}</span>
              <span className="text-white/50"> / 84,876</span>
            </div>
          </div>
          <div className="absolute -top-11 right-3 rotate-[8deg] animate-float">
            <Crunchy size={96} mood={hero.home ? "wow" : "smirk"} />
          </div>
          <div className="absolute -top-8 right-[118px] max-w-[150px] rounded-2xl rounded-br-md bg-white px-3 py-2 text-[13px] font-bold leading-snug text-[#0B1020] shadow-xl">
            {hero.home ? "They came home!" : "Guess first. Then press play."}
          </div>
        </div>

        <h1 className="enter mt-7 text-[44px] font-black leading-[0.98] tracking-[-0.045em]" style={{ animationDelay: "100ms" }}>
          Got a hunch?
          <br />
          <span className="bg-[linear-gradient(90deg,#FFE08A,#FFC94A_40%,#FF9F4A)] bg-clip-text text-transparent">Play it.</span>
        </h1>
        <p className="enter mt-3 text-[16px] leading-relaxed text-white/65" style={{ animationDelay: "160ms" }}>
          Every simulation from the Shorts, in your pocket. Make a guess, hit play, see who was right.
        </p>
        <div className="enter mt-6 space-y-2.5" style={{ animationDelay: "220ms" }}>
          <button type="button" className={`flex h-16 w-full items-center gap-3 rounded-[22px] pl-2 pr-5 text-[17px] font-black transition duration-300 active:translate-y-px active:scale-[0.98] ${SPRING} ${GOLD_BTN}`}>
            <span className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#2A1A00] text-[#FFC94A]">
              <Icon.Play size={20} />
            </span>
            Play two ants
            <Icon.Arrow size={20} className="ml-auto" />
          </button>
          <button type="button" className={`flex h-14 w-full items-center justify-center gap-2 rounded-[20px] text-[15px] font-bold text-white/85 transition active:scale-[0.98] ${GLASS}`}>
            <Icon.Youtube size={19} /> Watch the videos
          </button>
        </div>
      </section>

      <section className="px-4 pt-12">
        <h2 className="text-[26px] font-black tracking-[-0.03em]">Pick a hunch</h2>
        <p className="mt-1 text-[14px] text-white/55">The video setup is free. The rest is the full lab.</p>
        <div className="mt-5 space-y-4">
          {LAB.map((e, i) => (
            <button key={e.slug} type="button" className={`group block w-full overflow-hidden rounded-[28px] text-left transition duration-300 active:scale-[0.98] ${SPRING} ${GLASS}`}>
              <div
                className="relative grid h-36 place-items-center overflow-hidden"
                style={{ background: `radial-gradient(120% 90% at 30% 10%, ${e.accent}55, transparent 60%), radial-gradient(90% 80% at 90% 100%, ${e.accent2}33, transparent 60%), #0E1440` }}
              >
                {i === 0 ? (
                  <AntsThumb className="h-28 w-28 drop-shadow-[0_0_14px_rgb(63_210_255/0.45)] transition duration-500 group-hover:scale-110" cell={4.2} />
                ) : i === 1 ? (
                  <CoinThumb size={84} />
                ) : (
                  <PackThumb size={110} />
                )}
                <span className="absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white/90 backdrop-blur">
                  {e.fact} <span className="font-semibold normal-case text-white/60">{e.factLine}</span>
                </span>
              </div>
              <div className="flex items-end gap-3 p-5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[20px] font-black tracking-[-0.02em]">{e.title}</h3>
                  <p className="mt-1 text-[14px] leading-snug text-white/60">{e.hook}</p>
                  <div className="mt-3 flex gap-2 text-[12px] font-bold">
                    <span className="rounded-full bg-[#3EE6A0]/15 px-2.5 py-1 text-[#3EE6A0]">Free setup</span>
                    <span className="rounded-full bg-[#FFC94A]/15 px-2.5 py-1 text-[#FFC94A]">+{e.unlocks} in full</span>
                  </div>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#0B1020] transition group-hover:translate-x-0.5">
                  <Icon.Arrow size={18} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 pt-12">
        <h2 className="text-[26px] font-black tracking-[-0.03em]">Hands on the ants</h2>
        <div className={`mt-4 rounded-[30px] p-2 ${GLASS}`}>
          <div className="relative h-[230px] overflow-hidden rounded-[24px]">
            <AntsPreview className="h-full w-full" onStep={live.onStep} {...c.preview} />
            <div className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1.5 text-[12px] font-bold tabular-nums backdrop-blur-md">Step {fmt(live.step)}</div>
          </div>
          <div className="px-3 pb-3 pt-5">
            <div className="text-center">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/40">Speed</div>
              <div key={c.speed} className="enter text-[30px] font-black tabular-nums tracking-[-0.03em]">
                {SPEEDS[c.speed].rate ? `${SPEEDS[c.speed].label}/s` : "Auto"}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => c.setSpeed(Math.max(0, c.speed - 1))}
                aria-label="Slower"
                className={`grid h-14 w-14 place-items-center rounded-full transition duration-300 active:scale-90 ${SPRING} ${GLASS}`}
              >
                <Icon.Minus size={22} />
              </button>
              <button type="button" onClick={c.toggle} aria-label={c.playing ? "Pause" : "Play"} className={`grid h-20 w-20 place-items-center rounded-full transition duration-300 active:scale-90 ${SPRING} ${GOLD_BTN}`}>
                {c.playing ? <Icon.Pause size={30} /> : <Icon.Play size={30} />}
              </button>
              <button
                type="button"
                onClick={() => c.setSpeed(Math.min(SPEEDS.length - 1, c.speed + 1))}
                aria-label="Faster"
                className={`grid h-14 w-14 place-items-center rounded-full transition duration-300 active:scale-90 ${SPRING} ${GLASS}`}
              >
                <Icon.Plus size={22} />
              </button>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" onClick={c.step} className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold text-white/80 active:scale-95 ${GLASS}`}>
                <Icon.Step size={15} /> One step
              </button>
              <button type="button" onClick={c.restart} className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold text-white/80 active:scale-95 ${GLASS}`}>
                <Icon.Reset size={15} /> Restart
              </button>
            </div>
            <div className="mt-6 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/40">Rules · tap a letter</div>
            <div className="mt-2.5 flex gap-2.5">
              {c.rules.map((r, a) => (
                <div key={a} className="flex flex-1 items-center gap-1.5 rounded-[18px] p-1.5" style={{ background: `${ANT[a]}1F`, boxShadow: `inset 0 0 0 1px ${ANT[a]}55` }}>
                  <span className="ml-1.5 mr-0.5 h-3 w-3 rounded-full" style={{ background: ANT[a], boxShadow: `0 0 10px ${ANT[a]}` }} />
                  {r.split("").map((ch, p) => (
                    <button
                      key={`${p}${ch}`}
                      type="button"
                      onClick={() => c.flip(a, p)}
                      className="flip-in grid h-11 flex-1 place-items-center rounded-[13px] bg-white text-[18px] font-black shadow-[inset_0_-3px_0_rgb(0_0_0/0.12)] active:scale-95"
                      style={{ color: a ? "#B0158F" : "#0A7FA8" }}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-6 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/40">Presets</div>
            <div className="no-scrollbar -mx-3 mt-2.5 flex gap-2.5 overflow-x-auto px-3 pb-1">
              {PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => (p.locked ? c.locked("Presets") : c.restart())}
                  className={`relative grid h-[88px] w-[84px] shrink-0 place-items-center rounded-[20px] pb-5 transition duration-300 active:scale-95 ${SPRING} ${i === 0 ? "bg-white/[0.14] ring-2 ring-[#FFC94A]" : GLASS}`}
                >
                  <AntsThumb className={`h-10 w-10 ${p.locked ? "opacity-40" : ""}`} cell={1.55} colors={i % 2 ? ["#FFD166", "#3EE6A0"] : ANT} />
                  <span className="absolute bottom-2 text-[11px] font-bold text-white/80">{p.name}</span>
                  {p.locked && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/50 text-white/70">
                      <Icon.Lock size={11} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={`mx-auto mt-3 w-fit rounded-full bg-white px-4 py-2 text-[13px] font-bold text-[#0B1020] transition duration-300 ${SPRING} ${c.hint ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
          {c.hint || "…"}
        </div>
      </section>

      <section className="pt-10">
        <div className="px-4">
          <h2 className="text-[26px] font-black tracking-[-0.03em]">Your badge levels up</h2>
          <p className="mt-1 text-[14px] text-white/55">Same $3, same full lab. Stay longer, shinier badge.</p>
        </div>
        <div className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-3">
          {TIERS.map((t, i) => (
            <button key={t.id} type="button" onClick={() => setTier(i)} className="w-[136px] shrink-0 snap-center text-center">
              <div className={`relative mx-auto grid h-[132px] place-items-center transition duration-500 ${SPRING} ${tier === i ? "-translate-y-2 scale-105" : ""}`}>
                <Emblem tier={t.id} size={108} />
              </div>
              <div
                className={`mx-auto -mt-2 h-4 w-24 rounded-[50%] transition ${tier === i ? "opacity-100" : "opacity-50"}`}
                style={{ background: "radial-gradient(closest-side, rgb(255 255 255 / 0.22), transparent)" }}
              />
              <div className="mt-2 text-[15px] font-black tracking-[-0.01em]">{t.name}</div>
              <div className={`mx-auto mt-1.5 w-fit rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${tier === i ? "bg-[#FFC94A] text-[#2A1A00]" : "bg-white/10 text-white/60"}`}>
                {t.months} {t.months === 1 ? "month" : "months"}
              </div>
            </button>
          ))}
        </div>
        <p className="mt-3 px-4 text-center text-[14px] font-semibold text-white/70">“{TIERS[tier].line}”</p>
      </section>

      <section className="px-4 pt-10">
        <div className="rounded-[30px] bg-[linear-gradient(135deg,#FFC94A,#FF7AD9_55%,#3FE0FF)] p-px">
          <div className="rounded-[29px] bg-[#10163F] p-5">
            <div className="flex items-center gap-3">
              <Crunchy size={56} mood="grin" />
              <div>
                <div className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#FFC94A]">Full lab</div>
                <div className="text-[22px] font-black leading-tight tracking-[-0.02em]">$3 a month. All of it.</div>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {UNLOCKS.map((u) => (
                <li key={u} className="flex items-center gap-2.5 text-[15px] font-semibold text-white/80">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#3EE6A0]/20 text-[#3EE6A0]">
                    <Icon.Check size={14} />
                  </span>
                  {u}
                </li>
              ))}
            </ul>
            <button type="button" className={`mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[20px] text-[16px] font-black transition duration-300 active:scale-[0.98] ${SPRING} ${GOLD_BTN}`}>
              Join on Patreon <Icon.Out size={18} />
            </button>
          </div>
        </div>
      </section>

      <p className="mt-12 text-center text-[13px] font-semibold text-white/35">Every simulation here is our own code.</p>
    </div>
  );
}
