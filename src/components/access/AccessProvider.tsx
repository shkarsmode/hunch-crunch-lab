"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { DEFAULT_FLAGS } from "@/lib/flags";
import type { Me } from "@/lib/me";
import UpsellSheet from "./UpsellSheet";

type Access = Me & {
  loading: boolean;
  unlocked: boolean;
  isAdmin: boolean;
  flag: (key: string) => boolean;
  upsell: (reason?: string) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const EMPTY: Me = { configured: false, patreon: false, user: null, role: "user", supporter: null, flags: DEFAULT_FLAGS };

const Ctx = createContext<Access | null>(null);

function devUnlocked() {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("dev_unlock");
    if (q !== null) localStorage.setItem("hc_dev_unlock", q === "0" ? "0" : "1");
    return localStorage.getItem("hc_dev_unlock") === "1";
  } catch {
    return false;
  }
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [dev, setDev] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  const refresh = useCallback(
    () =>
      fetch("/api/me", { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<Me>) : null))
        .then((j) => {
          if (j) setMe(j);
        })
        .catch(() => {})
        .finally(() => {
          setDev(devUnlocked());
          setLoading(false);
        }),
    [],
  );

  useEffect(() => {
    refresh();
    const sb = getBrowserSupabase();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange(() => refresh());
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const signIn = useCallback(async () => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    const next = window.location.pathname + window.location.search;
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }, []);

  const signOut = useCallback(async () => {
    await getBrowserSupabase()?.auth.signOut();
    await refresh();
  }, [refresh]);

  const value = useMemo<Access>(() => {
    const isAdmin = me.role === "admin";
    const paywall = me.flags.paywall ?? true;
    return {
      ...me,
      loading,
      isAdmin,
      unlocked: dev || isAdmin || !paywall || Boolean(me.supporter?.active),
      flag: (key) => me.flags[key] ?? DEFAULT_FLAGS[key] ?? false,
      upsell: (r) => setReason(r ?? ""),
      signIn,
      signOut,
      refresh,
    };
  }, [me, loading, dev, signIn, signOut, refresh]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {reason !== null && <UpsellSheet reason={reason} onClose={() => setReason(null)} />}
    </Ctx.Provider>
  );
}

export function useAccess() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAccess outside AccessProvider");
  return v;
}

export function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4.5" y="10.5" width="15" height="10" rx="3" fill="currentColor" fillOpacity="0.18" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
      <circle cx="12" cy="15.4" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Locked({ children, label, className = "", inline = false }: { children: ReactNode; label?: string; className?: string; inline?: boolean }) {
  const { unlocked, upsell } = useAccess();
  if (unlocked) return className || inline ? <div className={`${inline ? "inline-block" : ""} ${className}`}>{children}</div> : <>{children}</>;
  return (
    <div className={`relative ${inline ? "inline-block" : ""} ${className}`}>
      <div aria-hidden inert className="pointer-events-none select-none opacity-40 saturate-50">
        {children}
      </div>
      <button
        type="button"
        onClick={() => upsell(label)}
        aria-label={label ? `Unlock: ${label}` : "Unlock the full lab"}
        className="absolute inset-0 flex items-start justify-end rounded-xl p-1.5 text-gold transition hover:bg-gold/5 focus-visible:outline-2 focus-visible:outline-gold"
      >
        <span className="flex items-center gap-1 rounded-full bg-navy-950/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-gold/40">
          <LockIcon className="h-3.5 w-3.5" />
          Full
        </span>
      </button>
    </div>
  );
}
