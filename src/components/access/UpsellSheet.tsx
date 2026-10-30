"use client";

import { useEffect } from "react";
import Link from "next/link";
import Crunchy from "@/components/Crunchy";
import { CHANNEL_URL, PATREON_URL, PRICE } from "@/lib/site";
import { useAccess } from "./AccessProvider";

const PERKS = [
  "Every experiment and every setting",
  "New games after the videos",
  "Send ideas for the next videos",
  "A badge that levels up every month",
];

export default function UpsellSheet({ reason, onClose }: { reason: string; onClose: () => void }) {
  const { configured, patreon, user, signIn, unlocked } = useAccess();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    if (unlocked) onClose();
  }, [unlocked, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Unlock the full lab">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm animate-[pop_.2s_ease-out_both]" />
      <div className="glass relative w-full max-w-md rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl animate-rise sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-edge/40 sm:hidden" />
        <div className="flex items-center gap-4">
          <Crunchy size={64} mood="wow" className="shrink-0 animate-float" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Full lab</p>
            <h2 className="display text-2xl font-black">Unlock everything</h2>
          </div>
        </div>
        {reason && <p className="mt-4 text-sm text-mist">{reason} is part of the full lab.</p>}
        <div className="mt-5 flex items-baseline gap-2">
          <span className="display text-5xl font-black text-shine">{PRICE}</span>
          <span className="text-mist">/ month</span>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-mint/15 text-[11px] text-mint">✓</span>
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-mist">Your support keeps the channel going. Thank you, really. 💛</p>
        <div className="mt-6 grid gap-2">
          {!configured || !patreon ? (
            <>
              <div className="rounded-2xl bg-navy-950/60 px-4 py-3 text-center text-sm font-semibold text-gold ring-1 ring-gold/30">
                Supporter access opens very soon
              </div>
              <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="rounded-2xl bg-coral px-4 py-3 text-center font-bold text-navy-950 transition active:scale-[.98]">
                Subscribe on YouTube to catch it
              </a>
            </>
          ) : !user ? (
            <>
              <button type="button" onClick={signIn} className="rounded-2xl bg-ink px-4 py-3 font-bold text-navy-950 transition active:scale-[.98]">
                Sign in with Google (free)
              </button>
              <p className="text-center text-xs text-mist">Then connect Patreon in one tap.</p>
            </>
          ) : (
            <>
              {PATREON_URL && (
                <a href={PATREON_URL} target="_blank" rel="noreferrer" className="rounded-2xl bg-gold px-4 py-3 text-center font-black text-navy-950 transition active:scale-[.98]">
                  Support on Patreon · {PRICE}/mo
                </a>
              )}
              <a href="/api/patreon/login" className="rounded-2xl bg-navy-950/60 px-4 py-3 text-center font-semibold ring-1 ring-edge/40 transition active:scale-[.98]">
                I already support: connect Patreon
              </a>
            </>
          )}
          <Link href="/support" onClick={onClose} className="py-2 text-center text-sm text-mist underline-offset-4 hover:underline">
            See the supporter tiers
          </Link>
        </div>
      </div>
    </div>
  );
}
