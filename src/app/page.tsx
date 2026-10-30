import Link from "next/link";
import Crunchy from "@/components/Crunchy";
import ExperimentCard from "@/components/ExperimentCard";
import TierBadge from "@/components/TierBadge";
import AntsPreview from "@/components/labs/ants/AntsPreview";
import { EXPERIMENTS } from "@/lib/experiments";
import { TIERS } from "@/lib/tiers";
import { CHANNEL_URL, PRICE } from "@/lib/site";
import { SEED_IDEAS, STATUS } from "@/data/ideas";

const STEPS = [
  { n: "1", title: "Lock in your hunch", text: "Every experiment starts with a guess. No take-backs." },
  { n: "2", title: "Run the real thing", text: "The same code that made the video, running in your browser." },
  { n: "3", title: "Crunch the truth", text: "Exact numbers, no hand-waving. Was your gut right?" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid items-center gap-8 pb-10 pt-8 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-gold ring-1 ring-gold/30">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> The lab is open
          </p>
          <h1 className="display mt-4 text-[44px] font-black leading-[0.95] sm:text-6xl lg:text-7xl">
            Got a hunch?
            <br />
            <span className="text-shine">Play it.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-mist">
            The simulations from the Hunch Crunch videos, now in your hands. Guess first, then run the real thing and see who was right: you or the math.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/lab/two-ants" className="rounded-2xl bg-gold px-6 py-3.5 text-base font-black text-navy-950 shadow-[0_10px_40px_-10px_#ffc94a] transition hover:-translate-y-0.5 active:scale-95">
              Play two ants 🐜
            </Link>
            <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="rounded-2xl px-6 py-3.5 text-base font-bold ring-1 ring-edge/40 transition hover:bg-ink/5 active:scale-95">
              Watch the videos
            </a>
          </div>
        </div>
        <div className="relative animate-rise [animation-delay:120ms]">
          <div className="glass relative aspect-square overflow-hidden rounded-[2rem] shadow-2xl sm:aspect-[4/3.4]">
            <AntsPreview className="absolute inset-0" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/90 to-transparent p-4 pt-12">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Live · not a video</p>
              <p className="display text-lg font-black">Two ants, same 2 rules. Watch them come home.</p>
            </div>
          </div>
          <Crunchy size={84} mood="squint" className="absolute -right-2 -top-9 drop-shadow-2xl animate-float sm:-right-6 sm:-top-10" />
        </div>
      </section>

      <section id="lab" className="scroll-mt-20 pt-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan">The lab</p>
            <h2 className="display mt-1 text-3xl font-black sm:text-4xl">Pick an experiment</h2>
          </div>
          <p className="hidden max-w-xs text-right text-sm text-mist sm:block">New ones after the videos. The one from the video is always free to try.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIMENTS.map((e, i) => (
            <ExperimentCard key={e.slug} e={e} i={i} />
          ))}
        </div>
      </section>

      <section className="pt-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="glass rounded-3xl p-5">
              <span className="display grid h-10 w-10 place-items-center rounded-xl bg-ink text-lg font-black text-navy-950">{s.n}</span>
              <h3 className="display mt-4 text-lg font-black">{s.title}</h3>
              <p className="mt-1 text-sm text-mist">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-20">
        <div className="glass relative overflow-hidden rounded-[2rem] p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Full lab</p>
              <h2 className="display mt-1 text-3xl font-black sm:text-4xl">
                <span className="text-shine">{PRICE}</span> a month. Everything unlocked.
              </h2>
              <p className="mt-3 max-w-md text-mist">Every setting, every experiment, every new game. Send ideas for the next videos. Your badge levels up the longer you stay. And it keeps the channel going. Thank you, really.</p>
              <Link href="/support" className="mt-6 inline-block rounded-2xl bg-gold px-6 py-3.5 font-black text-navy-950 transition hover:-translate-y-0.5 active:scale-95">
                See the tiers
              </Link>
            </div>
            <div className="no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 pb-2">
              {TIERS.map((t, i) => (
                <div key={t.id} className="flex w-28 shrink-0 flex-col items-center rounded-2xl bg-navy-950/50 p-3 text-center ring-1 ring-edge/20 animate-rise" style={{ animationDelay: `${i * 90}ms` }}>
                  <TierBadge tier={t} size={64} />
                  <p className="mt-2 text-xs font-black leading-tight">{t.name}</p>
                  <p className="num text-[11px] text-mist">{t.months} mo</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">You ask, we crunch</p>
            <h2 className="display mt-1 text-3xl font-black sm:text-4xl">Ideas from viewers</h2>
          </div>
          <Link href="/ideas" className="shrink-0 text-sm font-bold text-mint hover:underline">
            All ideas →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SEED_IDEAS.map((idea) => {
            const s = STATUS[idea.status];
            return (
              <div key={idea.id} className="glass flex items-start gap-3 rounded-2xl p-4">
                <span className="text-2xl">{s.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{idea.title}</p>
                  <p className="mt-0.5 truncate text-sm text-mist">
                    {idea.by} · <span style={{ color: s.color }}>{s.label}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
