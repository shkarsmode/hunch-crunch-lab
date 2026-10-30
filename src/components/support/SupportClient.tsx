"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Crunchy from "@/components/Crunchy";
import TierBadge from "@/components/TierBadge";
import { useAccess } from "@/components/access/AccessProvider";
import { CHANNEL_URL, PATREON_URL, PRICE } from "@/lib/site";
import { FOUNDER_SLOTS, TIERS, nextTier, tierFor } from "@/lib/tiers";

type Wall = { supporters: { name: string; months: number; founderNo: number | null }[]; foundersTaken: number; founderSlots: number };

const NOTES: Record<string, { text: string; good?: boolean }> = {
  ok: { text: "Connected. Everything is unlocked. Thank you! 💛", good: true },
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

export default function SupportClient() {
  const { configured, patreon, user, supporter, signIn, refresh, unlocked, isAdmin } = useAccess();
  const query = useSyncExternalStore(noop, () => window.location.search, () => "");
  const note = NOTES[new URLSearchParams(query).get("patreon") ?? ""];
  const [wall, setWall] = useState<Wall | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const save = async (patch: { showOnWall?: boolean; wallName?: string }) => {
    setSaving(true);
    await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).catch(() => {});
    await refresh();
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 sm:pt-14">
      {note && (
        <p className={`mb-6 rounded-2xl px-4 py-3 text-sm font-bold animate-pop ${note.good ? "bg-mint/15 text-mint ring-1 ring-mint/40" : "bg-coral/10 text-coral ring-1 ring-coral/40"}`}>{note.text}</p>
      )}

      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="animate-rise">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Full lab</p>
          <h1 className="display mt-2 text-5xl font-black leading-[0.95] sm:text-6xl">
            <span className="text-shine">{PRICE}</span> a month.
            <br />
            Everything unlocked.
          </h1>
          <p className="mt-4 max-w-md text-lg text-mist">Every setting, every experiment, every new game after the videos. Your support keeps Hunch Crunch going. Thank you, really.</p>
        </div>

        <div className="glass rounded-[2rem] p-6 animate-rise [animation-delay:100ms]">
          {active ? (
            <div className="text-center">
              {tier && <TierBadge tier={tier} size={112} founder={Boolean(supporter?.founderNo)} className="mx-auto" />}
              <p className="display mt-3 text-2xl font-black">You&apos;re in. Thank you! 💛</p>
              <p className="mt-1 text-sm text-mist">
                {tier ? tier.name : "Supporter"} · {months} {months === 1 ? "month" : "months"}
                {supporter?.founderNo ? ` · Founder #${supporter.founderNo}` : ""}
              </p>
              {next && <p className="mt-2 text-xs text-mist">{next.months - months} more {next.months - months === 1 ? "month" : "months"} to {next.name}</p>}
              <div className="mt-5 space-y-2 text-left">
                <label className="flex items-center justify-between rounded-xl bg-navy-950/50 px-3 py-2.5 text-sm ring-1 ring-edge/25">
                  <span>Show me on the supporter wall</span>
                  <input type="checkbox" checked={supporter?.onWall ?? true} disabled={saving} onChange={(e) => save({ showOnWall: e.target.checked })} className="h-5 w-5 accent-gold" />
                </label>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save({ wallName: name ?? "" });
                  }}
                >
                  <input
                    value={name ?? supporter?.wallName ?? ""}
                    onChange={(e) => setName(e.target.value.slice(0, 40))}
                    placeholder="Name on the wall"
                    className="min-w-0 flex-1 rounded-xl bg-navy-950/50 px-3 py-2.5 text-sm outline-none ring-1 ring-edge/25 focus:ring-gold/60"
                    aria-label="Name on the wall"
                  />
                  <button type="submit" disabled={saving} className="rounded-xl bg-ink px-4 text-sm font-black text-navy-950">Save</button>
                </form>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Crunchy size={56} mood="grin" className="shrink-0" />
                <p className="display text-xl font-black">Three taps and you&apos;re in</p>
              </div>
              {!configured || !patreon ? (
                <div className="mt-5 space-y-3">
                  <p className="rounded-2xl bg-navy-950/60 px-4 py-3 text-center text-sm font-bold text-gold ring-1 ring-gold/30">Supporter access opens very soon</p>
                  <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="block rounded-2xl bg-coral px-4 py-3 text-center font-black text-navy-950">
                    Subscribe on YouTube to catch it
                  </a>
                </div>
              ) : (
                <ol className="mt-5 space-y-2.5">
                  <li>
                    <button type="button" onClick={signIn} disabled={Boolean(user)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition ${user ? "bg-mint/10 text-mint ring-1 ring-mint/30" : "bg-ink text-navy-950 active:scale-[.98]"}`}>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-950/15 text-sm">{user ? "✓" : "1"}</span>
                      {user ? `Signed in as ${user.name}` : "Sign in with Google (free)"}
                    </button>
                  </li>
                  <li>
                    <a href={PATREON_URL || CHANNEL_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-gold px-4 py-3 font-black text-navy-950 active:scale-[.98]">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-950/15 text-sm">2</span>
                      Join on Patreon · {PRICE}/mo
                    </a>
                  </li>
                  <li>
                    <a href={user ? "/api/patreon/login" : "#"} onClick={(e) => !user && (e.preventDefault(), signIn())} className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold ring-1 ring-edge/40 active:scale-[.98]">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink/10 text-sm">3</span>
                      Connect Patreon to unlock
                    </a>
                  </li>
                </ol>
              )}
              {unlocked && isAdmin && <p className="mt-3 text-center text-xs text-mist">You&apos;re an admin, so everything is already unlocked for you.</p>}
            </>
          )}
        </div>
      </section>

      <section className="pt-20">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan">Tiers</p>
        <h2 className="display mt-1 text-3xl font-black sm:text-4xl">Your badge levels up</h2>
        <p className="mt-2 max-w-xl text-mist">Same {PRICE}, same full lab. The longer you stay, the fancier your badge on the wall.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TIERS.map((t, i) => (
            <div key={t.id} className={`glass flex flex-col items-center rounded-3xl p-5 text-center animate-rise ${tier?.id === t.id && active ? "ring-2 ring-gold" : ""}`} style={{ animationDelay: `${i * 80}ms` }}>
              <TierBadge tier={t} size={84} />
              <p className="display mt-3 text-lg font-black" style={{ color: t.color }}>{t.name}</p>
              <p className="num text-xs font-bold text-mist">{t.months} {t.months === 1 ? "month" : "months"}</p>
              <p className="mt-2 text-sm text-mist">{t.line}</p>
            </div>
          ))}
        </div>
        <div className="glass mt-3 flex flex-wrap items-center gap-4 rounded-3xl p-5">
          <TierBadge tier={TIERS[0]} size={56} founder />
          <div className="min-w-0 flex-1">
            <p className="display font-black text-gold">Founder ring</p>
            <p className="text-sm text-mist">The first {FOUNDER_SLOTS} supporters keep a gold ring around their badge forever.</p>
          </div>
          <p className="num text-right text-sm">
            <span className="display text-2xl font-black text-ink">{taken}</span>
            <span className="text-mist"> / {wall?.founderSlots ?? FOUNDER_SLOTS} taken</span>
          </p>
        </div>
      </section>

      <section className="pt-20">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">Supporter wall</p>
        <h2 className="display mt-1 text-3xl font-black sm:text-4xl">The people keeping the lab open</h2>
        {wall && wall.supporters.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {wall.supporters.map((s, i) => {
              const t = tierFor(s.months) ?? TIERS[0];
              return (
                <div key={i} className="glass flex items-center gap-3 rounded-2xl p-3 animate-rise" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                  <TierBadge tier={t} size={44} founder={Boolean(s.founderNo)} />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{s.name}</p>
                    <p className="num text-xs text-mist">{t.name}{s.founderNo ? ` · #${s.founderNo}` : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass mt-6 flex flex-col items-center rounded-3xl px-6 py-10 text-center">
            <Crunchy size={72} mood="squint" />
            <p className="display mt-3 text-xl font-black">No names here yet.</p>
            <p className="mt-1 text-mist">Founder #1 could be you.</p>
          </div>
        )}
      </section>

      <section className="pt-20">
        <h2 className="display text-3xl font-black">Questions</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {FAQ.map((f) => (
            <div key={f.q} className="glass rounded-2xl p-5">
              <p className="font-bold">{f.q}</p>
              <p className="mt-1 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
