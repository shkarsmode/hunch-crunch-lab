"use client";

import { useEffect } from "react";
import Link from "next/link";
import Crunchy from "@/components/Crunchy";
import Emblem from "@/components/ui/Emblem";
import { Icon } from "@/components/ui/icons";
import { btn } from "@/components/ui/kit";
import { CHANNEL_URL, PATREON_URL, PRICE } from "@/lib/site";
import { useAccess } from "./AccessProvider";

const PERKS = ["Every experiment and every setting", "New games after the videos", "Send ideas for the next videos", "A badge that levels up every month"];

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
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-[3px] animate-[pop_.2s_ease-out_both]" />
      <div className="sheet-up relative w-full max-w-md rounded-t-[22px] border border-hair bg-navy-850 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-30px_80px_-20px_rgb(0_0_0/0.9)] sm:rounded-[22px]">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-white/15 sm:hidden" />
        <div className="flex items-start gap-3.5">
          <Crunchy size={48} mood="wow" shadow={false} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-[0.1em] text-gold">FULL LAB</p>
            <h2 className="text-[22px] font-bold leading-tight tracking-[-0.03em]">Unlock everything</h2>
            {reason && <p className="mt-1 text-[13px] text-ink/50">{reason} is part of the full lab.</p>}
          </div>
          <button type="button" onClick={onClose} className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink/40 transition hover:bg-white/5 hover:text-ink" aria-label="Close">
            <Icon.Close size={18} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-hair bg-white/[0.02] px-4 py-3">
          <div className="flex items-baseline gap-1.5">
            <span className="headline text-[38px] leading-none text-gold">{PRICE}</span>
            <span className="text-[14px] text-ink/45">/ month</span>
          </div>
          <div className="flex -space-x-3">
            {(["coin", "dice", "streak", "golden", "million"] as const).map((t) => (
              <Emblem key={t} tier={t} size={34} />
            ))}
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-[14px] text-ink/75">
              <Icon.Check size={16} className="shrink-0 text-mint" /> {p}
            </li>
          ))}
        </ul>

        <div className="mt-5 grid gap-2">
          {!configured || !patreon ? (
            <>
              <div className="rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3 text-center text-[14px] text-gold">Supporter access opens very soon</div>
              <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={btn("ghost", "lg")}>
                <Icon.Youtube size={18} /> Subscribe to catch it
              </a>
            </>
          ) : !user ? (
            <>
              <button type="button" onClick={signIn} className={btn("primary", "lg")}>
                Sign in with Google (free)
              </button>
              <p className="text-center font-mono text-[10px] tracking-[0.08em] text-ink/40">THEN CONNECT PATREON IN ONE TAP</p>
            </>
          ) : (
            <>
              {PATREON_URL && (
                <a href={PATREON_URL} target="_blank" rel="noreferrer" className={btn("primary", "lg")}>
                  Support on Patreon · {PRICE}/mo <Icon.Out size={17} />
                </a>
              )}
              <a href="/api/patreon/login" className={btn("ghost", "lg")}>
                I already support: connect Patreon
              </a>
            </>
          )}
          <Link href="/support" onClick={onClose} className="py-2 text-center font-mono text-[11px] tracking-[0.08em] text-ink/45 transition hover:text-ink">
            SEE THE SUPPORTER TIERS →
          </Link>
        </div>
      </div>
    </div>
  );
}
