import Link from "next/link";
import LiveAnts from "@/components/home/LiveAnts";
import Emblem from "@/components/ui/Emblem";
import { Icon } from "@/components/ui/icons";
import { AntsThumb, CoinThumb, PackThumb } from "@/components/ui/thumbs";
import { ButtonLink, LiveDot, SectionLabel, Tag, btn } from "@/components/ui/kit";
import { EXPERIMENTS, type Experiment } from "@/lib/experiments";
import { TIERS } from "@/lib/tiers";
import { CHANNEL_URL, PRICE, shortUrl } from "@/lib/site";
import { SEED_IDEAS, STATUS } from "@/data/ideas";

const FACTS: Record<string, { n: string; line: string }> = {
  "two-ants": { n: "84,876", line: "steps until the grid is clean" },
  coin: { n: "10,000", line: "real coins to fool" },
  stickers: { n: "$2,000", line: "to finish the album, not $280" },
};

const STEPS = [
  { title: "Lock in your hunch", text: "Every experiment starts with a guess. No take-backs." },
  { title: "Run the real thing", text: "The same code that made the video, running in your browser." },
  { title: "Crunch the truth", text: "Exact numbers, no hand-waving. Was your gut right?" },
];

const UNLOCKS = ["Up to 6 ants, any rules, up to 1M steps a second", "Every new game after the videos", "Send ideas for the next videos", "A badge on the wall that levels up"];

function Thumb({ slug, big = false }: { slug: string; big?: boolean }) {
  if (slug === "two-ants") return <AntsThumb className={big ? "h-24 w-24" : "h-11 w-11"} cell={big ? 3.4 : 1.7} />;
  if (slug === "coin") return <CoinThumb size={big ? 70 : 34} />;
  return <PackThumb size={big ? 96 : 46} />;
}

function LabItem({ e, i }: { e: Experiment; i: number }) {
  return (
    <Link
      href={`/lab/${e.slug}`}
      className="enter group flex items-center gap-4 px-4 py-4 transition hover:bg-white/[0.025] active:bg-white/[0.05] lg:flex-col lg:items-stretch lg:gap-0 lg:p-6"
      style={{ animationDelay: `${120 + i * 60}ms` }}
    >
      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-hair bg-navy-800 lg:hidden">
        <Thumb slug={e.slug} />
      </div>
      <div className="hidden h-36 place-items-center rounded-xl border border-hair bg-navy-950/60 lg:grid">
        <Thumb slug={e.slug} big />
      </div>
      <div className="min-w-0 flex-1 lg:mt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate text-[16px] font-semibold tracking-[-0.01em] lg:text-[18px]">{e.title}</h3>
          <span className="hidden font-mono text-[12px] tabular-nums text-ink/40 lg:block">{FACTS[e.slug]?.n}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink/45 lg:mt-1.5 lg:text-[14px]">{e.hook}</p>
        <div className="mt-2 flex gap-3 lg:mt-4">
          <Tag tone="free">Free setup</Tag>
          {e.full && <Tag>+{e.full.length} in full lab</Tag>}
        </div>
      </div>
      <Icon.Chevron size={18} className="shrink-0 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-ink/60 lg:hidden" />
    </Link>
  );
}

export default function Home() {
  const live = EXPERIMENTS.filter((e) => e.status === "live");
  const soon = EXPERIMENTS.filter((e) => e.status === "soon");

  return (
    <div className="mx-auto max-w-6xl">
      <section className="pt-5 lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14 lg:px-6 lg:pt-16">
        <div className="lg:order-2">
          <div className="enter flex items-center gap-2 px-4 font-mono text-[11px] tracking-[0.08em] text-ink/50 lg:px-0">
            <LiveDot /> LIVE · E030 · TWO ANTS
          </div>
          <LiveAnts className="enter mt-3 h-[300px] border-y border-hair sm:h-[380px] lg:h-[480px] lg:rounded-2xl lg:border" />
        </div>
        <div className="px-4 lg:order-1 lg:px-0">
          <h1 className="headline enter mt-6 text-[42px] leading-[1.0] sm:text-[56px] lg:mt-0 lg:text-[72px]" style={{ animationDelay: "80ms" }}>
            Got a hunch?
            <br />
            <span className="text-gold">Play it.</span>
          </h1>
          <p className="enter mt-4 max-w-[36ch] text-[15px] leading-relaxed text-ink/55 lg:text-[17px]" style={{ animationDelay: "140ms" }}>
            The simulations from the Shorts, in your hands. Guess first, then run the real thing and see who was right.
          </p>
          <div className="enter mt-7 flex gap-2.5" style={{ animationDelay: "200ms" }}>
            <ButtonLink href="/lab/two-ants" size="lg" className="flex-1 sm:flex-none sm:px-7">
              Play two ants <Icon.Arrow size={18} className="transition group-hover:translate-x-0.5" />
            </ButtonLink>
            <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={btn("ghost", "lg")}>
              <Icon.Youtube size={18} /> Videos
            </a>
          </div>
        </div>
      </section>

      <section className="mt-9 grid grid-cols-3 divide-x divide-hair border-y border-hair lg:mx-6 lg:mt-16 lg:rounded-2xl lg:border">
        {live.map((e) => (
          <div key={e.slug} className="px-4 py-4 lg:px-6 lg:py-5">
            <div className="font-mono text-[17px] tabular-nums lg:text-[24px]">{FACTS[e.slug]?.n}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-ink/40 lg:text-[13px]">{FACTS[e.slug]?.line}</div>
          </div>
        ))}
      </section>

      <section id="lab" className="scroll-mt-16 pt-12 lg:pt-20">
        <SectionLabel n="01" title="The lab" right={`${live.length} LIVE · ${soon.length} SOON`} className="px-4 pb-3 lg:px-6" />
        <div className="divide-y divide-hair border-y border-hair lg:mx-6 lg:grid lg:grid-cols-3 lg:divide-x lg:divide-y-0 lg:overflow-hidden lg:rounded-2xl lg:border">
          {live.map((e, i) => (
            <LabItem key={e.slug} e={e} i={i} />
          ))}
        </div>
        <div className="mt-6 px-4 lg:px-6">
          <SectionLabel title="Next in the lab" right="FROM THE SHORTS" className="pb-2" />
          <div className="grid divide-y divide-hair border-y border-hair sm:grid-cols-2 sm:divide-y-0 sm:border-0 sm:gap-x-6">
            {soon.map((e, i) => (
              <div key={e.slug} className="flex items-center gap-3 py-3 sm:border-b sm:border-hair">
                <span className="w-5 font-mono text-[11px] text-ink/25">{String(i + live.length + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-ink/70">{e.title}</div>
                  <div className="truncate text-[12px] text-ink/35">{e.hook}</div>
                </div>
                {e.video ? (
                  <a href={shortUrl(e.video)} target="_blank" rel="noreferrer" className="shrink-0 font-mono text-[10px] tracking-[0.08em] text-ink/45 transition hover:text-ink">
                    WATCH ↗
                  </a>
                ) : (
                  <Tag>Soon</Tag>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-14 lg:px-6 lg:pt-20">
        <SectionLabel n="02" title="How it works" className="pb-3" />
        <ol className="divide-y divide-hair border-y border-hair lg:grid lg:grid-cols-3 lg:divide-x lg:divide-y-0 lg:rounded-2xl lg:border">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 py-4 lg:block lg:p-6">
              <span className="font-mono text-[12px] text-gold">{String(i + 1).padStart(2, "0")}</span>
              <div className="lg:mt-3">
                <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{s.title}</h3>
                <p className="mt-0.5 text-[14px] leading-snug text-ink/45">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-4 pt-14 lg:px-6 lg:pt-20">
        <SectionLabel n="03" title="Full lab" right={`${PRICE} / MONTH`} className="pb-3" />
        <div className="overflow-hidden rounded-2xl border border-hair bg-gradient-to-b from-white/[0.035] to-transparent lg:grid lg:grid-cols-[1fr_1.1fr]">
          <div className="p-5 lg:p-8">
            <h2 className="headline text-[28px] leading-[1.05] lg:text-[38px]">Every rule, every speed, every game.</h2>
            <ul className="mt-5 space-y-2.5">
              {UNLOCKS.map((u) => (
                <li key={u} className="flex items-center gap-2.5 text-[14px] text-ink/70">
                  <Icon.Check size={16} className="shrink-0 text-mint" /> {u}
                </li>
              ))}
            </ul>
            <ButtonLink href="/support" size="lg" className="mt-6 w-full sm:w-auto sm:px-7">
              See the tiers <Icon.Arrow size={18} className="transition group-hover:translate-x-0.5" />
            </ButtonLink>
          </div>
          <div className="border-t border-hair p-5 lg:border-l lg:border-t-0 lg:p-8">
            <div className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
              {TIERS.map((t, i) => (
                <div key={t.id} className="w-[86px] shrink-0 text-center lg:w-auto">
                  <Emblem tier={t.id} size={72} className="mx-auto" />
                  <div className="mt-1.5 text-[12px] font-semibold leading-tight">{t.name}</div>
                  <div className="font-mono text-[10px] text-ink/40">{t.months} MO</div>
                  <span className="sr-only">{i + 1} of {TIERS.length}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-ink/45">Same price, same full lab. Your badge levels up the longer you stay.</p>
          </div>
        </div>
      </section>

      <section className="px-4 pt-14 lg:px-6 lg:pt-20">
        <SectionLabel
          n="04"
          title="You ask, we crunch"
          right={
            <Link href="/ideas" className="transition hover:text-ink">
              ALL IDEAS →
            </Link>
          }
          className="pb-3"
        />
        <div className="divide-y divide-hair border-y border-hair sm:grid sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0 sm:border-0">
          {SEED_IDEAS.map((idea) => {
            const s = STATUS[idea.status];
            return (
              <div key={idea.id} className="py-3.5 sm:border-b sm:border-hair">
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.08em]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  <span style={{ color: s.color }}>{s.label.toUpperCase()}</span>
                  <span className="truncate text-ink/30">{idea.by}</span>
                </div>
                <p className="mt-1 text-[15px] font-medium leading-snug">{idea.title}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
