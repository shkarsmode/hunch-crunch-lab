"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Crunchy from "@/components/Crunchy";
import Emblem from "@/components/ui/Emblem";
import { Icon } from "@/components/ui/icons";
import { SectionLabel, btn } from "@/components/ui/kit";
import { useAccess } from "@/components/access/AccessProvider";
import { CHANNEL_URL, PATREON_URL, PRICE } from "@/lib/site";
import { FOUNDER_SLOTS, TIERS, nextTier, tierFor } from "@/lib/tiers";

type Wall = { supporters: { name: string; months: number; founderNo: number | null }[]; foundersTaken: number; founderSlots: number };

const NOTES: Record<string, { text: string; good?: boolean }> = {
  ok: { text: "Connected. Everything is unlocked. Thank you!", good: true },
  inactive: { text: `We couldn't find an active ${PRICE} membership on that Patreon account.` },
  taken: { text: "That Patreon account is already linked to another player." },
  signin: { text: "Sign in first, then connect Patreon." },
  error: { text: "Something went wrong. Please try again." },
  off: { text: "Patreon isn't connected yet. Very soon." },
  slow: { text: "Too many tries. Give it a minute." },
};

const FAQ = [
  { q: "Can I still play for free?", a: "Yes. The setup from each video is always free to play." },
  { q: "Is it a subscription?", a: `Yes, ${PRICE} a month on Patreon. Cancel any time there, in two taps.` },
  { q: "Why Patreon?", a: "They take care of payments in every country. We never see your card." },
  { q: "What happens if I stop?", a: "The full lab locks again. Your months stay counted for when you come back." },
  { q: "Do I need an account?", a: "A free Google sign-in, so we know who to unlock. That's it." },
];

const noop = () => () => {};
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

function Step({ n, done, children }: { n: number; done?: boolean; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-3">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-[12px] ${done ? "bg-mint/15 text-mint" : "bg-black/15"}`}>
        {done ? <Icon.Check size={15} /> : String(n).padStart(2, "0")}
      </span>
      {children}
    </span>
  );
}

export default function SupportClient() {
  const { configured, patreon, user, supporter, signIn, refresh, unlocked, isAdmin } = useAccess();
  const query = useSyncExternalStore(noop, () => window.location.search, () => "");
  const note = NOTES[new URLSearchParams(query).get("patreon") ?? ""];
  const [wall, setWall] = useState<Wall | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [peek, setPeek] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/wall")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setWall(j))
      .catch(() => {});
  }, []);

  const active = Boolean(supporter?.active);
  const months = supporter?.months ?? 0;
  const tier = tierFor(months);
  const next = nextTier(months);
  const taken = wall?.foundersTaken ?? 0;
  const slots = wall?.founderSlots ?? FOUNDER_SLOTS;
  const current = active && tier ? TIERS.findIndex((t) => t.id === tier.id) : -1;
  const shown = peek ?? Math.max(0, current);

  const save = async (patch: { showOnWall?: boolean; wallName?: string }) => {
    setSaving(true);
    await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).catch(() => {});
    await refresh();
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-6xl pt-6 lg:px-6 lg:pt-14">
      {note && (
        <p
          className={`enter mx-4 mb-6 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[14px] lg:mx-0 ${note.good ? "border-mint/30 bg-mint/[0.07] text-mint" : "border-coral/30 bg-coral/[0.07] text-coral"}`}
        >
          {note.good ? <Icon.Check size={16} /> : <span className="font-mono text-[12px]">!</span>} {note.text}
        </p>
      )}

      <section className="lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-12">
        <div className="enter px-4 lg:px-0 lg:pt-6">
          <SectionLabel title={`Full lab · ${PRICE} / month`} className="text-gold/80" />
          <h1 className="headline mt-3 text-[44px] leading-[0.98] sm:text-[56px] lg:text-[68px]">
            <span className="text-gold">{PRICE}</span> a month.
            <br />
            Everything unlocked.
          </h1>
          <p className="mt-4 max-w-[38ch] text-[15px] leading-relaxed text-ink/55 lg:text-[17px]">
            Every setting, every experiment, every new game after the videos. Your support keeps Hunch Crunch going. Thank you, really.
          </p>
        </div>

        <div className="enter mx-4 mt-7 overflow-hidden rounded-2xl border border-hair bg-navy-850 lg:mx-0 lg:mt-0" style={{ animationDelay: "80ms" }}>
          {active ? (
            <div className="p-5">
              <div className="flex items-center gap-4">
                {tier && <Emblem tier={tier.id} size={88} founder={Boolean(supporter?.founderNo)} />}
                <div className="min-w-0">
                  <p className="text-[20px] font-bold tracking-[-0.02em]">You&apos;re in. Thank you!</p>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.08em] text-ink/50">
                    {(tier?.name ?? "Supporter").toUpperCase()} · {plural(months, "MONTH").toUpperCase()}
                    {supporter?.founderNo ? ` · FOUNDER #${supporter.founderNo}` : ""}
                  </p>
                </div>
              </div>
              {next && (
                <div className="mt-5">
                  <div className="flex justify-between font-mono text-[10px] tracking-[0.08em] text-ink/40">
                    <span>NEXT: {next.name.toUpperCase()}</span>
                    <span>{plural(next.months - months, "MONTH").toUpperCase()} TO GO</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (months / next.months) * 100)}%` }} />
                  </div>
                </div>
              )}
              <div className="mt-5 divide-y divide-hair rounded-xl border border-hair">
                <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-[14px]">
                  <span>Show me on the supporter wall</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={supporter?.onWall ?? true}
                    disabled={saving}
                    onChange={(e) => save({ showOnWall: e.target.checked })}
                    className="peer sr-only"
                  />
                  <span className="relative h-6 w-10 shrink-0 rounded-full bg-white/10 transition peer-checked:bg-gold after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
                </label>
                <form
                  className="flex gap-2 p-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save({ wallName: name ?? "" });
                  }}
                >
                  <input
                    value={name ?? supporter?.wallName ?? ""}
                    onChange={(e) => setName(e.target.value.slice(0, 40))}
                    placeholder="Name on the wall"
                    className="min-w-0 flex-1 rounded-lg bg-transparent px-2 text-[14px] outline-none placeholder:text-ink/30"
                    aria-label="Name on the wall"
                  />
                  <button type="submit" disabled={saving} className={btn("ghost", "sm")}>
                    Save
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-center gap-3">
                <Crunchy size={44} mood="grin" shadow={false} className="shrink-0" />
                <div>
                  <p className="text-[18px] font-bold tracking-[-0.02em]">Three steps and you&apos;re in</p>
                  <p className="font-mono text-[10px] tracking-[0.08em] text-ink/40">ABOUT A MINUTE · CANCEL ANY TIME</p>
                </div>
              </div>
              {!configured || !patreon ? (
                <div className="mt-5 space-y-2.5">
                  <p className="rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3 text-center text-[14px] text-gold">Supporter access opens very soon</p>
                  <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={btn("ghost", "lg", "w-full")}>
                    <Icon.Youtube size={18} /> Subscribe to catch it
                  </a>
                </div>
              ) : (
                <ol className="mt-5 space-y-2">
                  <li>
                    <button
                      type="button"
                      onClick={signIn}
                      disabled={Boolean(user)}
                      className={`flex h-14 w-full items-center rounded-xl px-3 text-left text-[15px] font-semibold transition active:scale-[0.99] ${user ? "border border-mint/25 bg-mint/[0.06] text-mint" : "bg-ink text-[#0B0D12]"}`}
                    >
                      <Step n={1} done={Boolean(user)}>
                        {user ? `Signed in as ${user.name}` : "Sign in with Google (free)"}
                      </Step>
                    </button>
                  </li>
                  <li>
                    <a href={PATREON_URL || CHANNEL_URL} target="_blank" rel="noreferrer" className={`${btn("primary", "lg", "h-14 w-full justify-start px-3")}`}>
                      <Step n={2}>Join on Patreon · {PRICE}/mo</Step>
                      <Icon.Out size={17} className="ml-auto" />
                    </a>
                  </li>
                  <li>
                    <a
                      href={user ? "/api/patreon/login" : "#"}
                      onClick={(e) => !user && (e.preventDefault(), signIn())}
                      className={`${btn("ghost", "lg", "h-14 w-full justify-start px-3")}`}
                    >
                      <Step n={3}>Connect Patreon to unlock</Step>
                      <Icon.Arrow size={17} className="ml-auto" />
                    </a>
                  </li>
                </ol>
              )}
              {unlocked && isAdmin && <p className="mt-3 font-mono text-[10px] tracking-[0.08em] text-ink/40">YOU&apos;RE AN ADMIN, SO EVERYTHING IS ALREADY UNLOCKED FOR YOU.</p>}
            </div>
          )}
        </div>
      </section>

      <section className="pt-14 lg:pt-20">
        <SectionLabel n="01" title="Tiers" right="SAME PRICE, NEW BADGE" className="px-4 pb-3 lg:px-0" />
        <div className="px-4 lg:px-0">
          <h2 className="headline text-[30px] leading-[1.05] lg:text-[40px]">Your badge levels up</h2>
          <p className="mt-2 max-w-[44ch] text-[14px] text-ink/50">Same {PRICE}, same full lab. The longer you stay, the fancier your badge on the wall.</p>
        </div>
        <div className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {TIERS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPeek(i)}
              className={`w-[188px] shrink-0 snap-start rounded-2xl border p-4 text-left transition lg:w-auto ${i === shown ? "border-gold/45 bg-gold/[0.04]" : "border-hair bg-white/[0.012] hover:border-hair-strong"}`}
            >
              <Emblem tier={t.id} size={92} className="-ml-1" muted={active && i > current} />
              <div className="mt-3 font-mono text-[10px] tracking-[0.1em] text-ink/40">
                {String(t.months).padStart(2, "0")} {t.months === 1 ? "MONTH" : "MONTHS"}
                {i === current ? " · YOU" : ""}
              </div>
              <div className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">{t.name}</div>
              <div className="mt-1 text-[12px] leading-snug text-ink/45">{t.line}</div>
            </button>
          ))}
        </div>
        <div className="mt-5 px-4 lg:px-0">
          <div className="relative h-px bg-white/10">
            <div className="absolute inset-y-0 left-0 bg-gold transition-all duration-500" style={{ width: `${(shown / (TIERS.length - 1)) * 100}%` }} />
            {TIERS.map((t, i) => (
              <span
                key={t.id}
                className={`absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition ${i <= shown ? "bg-gold" : "bg-navy-700"}`}
                style={{ left: `${(i / (TIERS.length - 1)) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2.5 flex justify-between font-mono text-[10px] text-ink/35">
            {TIERS.map((t) => (
              <span key={t.id}>{t.months}M</span>
            ))}
          </div>
        </div>

        <div className="mx-4 mt-6 flex items-center gap-4 rounded-2xl border border-hair bg-navy-850 p-4 lg:mx-0">
          <Emblem tier="coin" size={64} founder />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-gold">Founder ring</p>
            <p className="mt-0.5 text-[13px] leading-snug text-ink/50">The first {FOUNDER_SLOTS} supporters keep a gold ring around their badge forever.</p>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-gold" style={{ width: `${(taken / slots) * 100}%` }} />
            </div>
          </div>
          <p className="shrink-0 text-right font-mono">
            <span className="text-[22px] text-ink">{taken}</span>
            <span className="text-[11px] text-ink/40"> / {slots}</span>
          </p>
        </div>
      </section>

      <section className="pt-14 lg:pt-20">
        <SectionLabel n="02" title="Supporter wall" right={wall ? `${wall.supporters.length} NAMES` : ""} className="px-4 pb-3 lg:px-0" />
        {wall && wall.supporters.length > 0 ? (
          <div className="grid grid-cols-1 divide-y divide-hair border-y border-hair sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0 sm:border-0 lg:grid-cols-3">
            {wall.supporters.map((s, i) => {
              const t = tierFor(s.months) ?? TIERS[0];
              return (
                <div key={i} className="enter flex items-center gap-3 px-4 py-3 sm:border-b sm:border-hair sm:px-0" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                  <Emblem tier={t.id} size={44} founder={Boolean(s.founderNo)} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">{s.name}</p>
                    <p className="font-mono text-[10px] tracking-[0.08em] text-ink/40">
                      {t.name.toUpperCase()}
                      {s.founderNo ? ` · FOUNDER #${s.founderNo}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mx-4 flex items-center gap-4 rounded-2xl border border-dashed border-hair-strong px-5 py-6 lg:mx-0">
            <Crunchy size={52} mood="squint" shadow={false} />
            <div>
              <p className="text-[16px] font-semibold">No names here yet.</p>
              <p className="text-[14px] text-ink/50">Founder #1 could be you.</p>
            </div>
          </div>
        )}
      </section>

      <section className="pt-14 lg:pt-20">
        <SectionLabel n="03" title="Questions" className="px-4 pb-3 lg:px-0" />
        <div className="divide-y divide-hair border-y border-hair lg:grid lg:grid-cols-2 lg:gap-x-10 lg:divide-y-0 lg:border-0">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-4 lg:border-b lg:border-hair lg:px-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <Icon.Plus size={16} className="shrink-0 text-ink/40 transition duration-200 group-open:rotate-45" />
              </summary>
              <p className="-mt-1 pb-4 text-[14px] leading-relaxed text-ink/55">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
