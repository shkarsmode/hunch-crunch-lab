"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Crunchy from "@/components/Crunchy";
import { useAccess } from "@/components/access/AccessProvider";
import { Icon } from "@/components/ui/icons";
import { btn } from "@/components/ui/kit";

const NAV = [
  { href: "/#lab", label: "Lab" },
  { href: "/ideas", label: "Ideas" },
  { href: "/support", label: "Support" },
];

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

export default function SiteHeader() {
  const path = usePathname();
  const { user, configured, isAdmin, unlocked, signIn, signOut, supporter } = useAccess();
  const [account, setAccount] = useState(false);
  const [menu, setMenu] = useState(false);
  const accountRef = useOutside(account, () => setAccount(false));
  const menuRef = useOutside(menu, () => setMenu(false));

  if (path.startsWith("/lab/") || path === "/design") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-navy-900/95 md:bg-navy-900/80 md:backdrop-blur-xl" ref={menuRef}>
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Hunch Crunch Lab home">
          <Crunchy size={26} shadow={false} className="transition duration-300 group-hover:-rotate-6 group-active:animate-crunch" />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">Hunch Crunch</span>
          <span className="rounded-[5px] border border-white/15 px-1.5 py-px font-mono text-[10px] text-ink/55">LAB</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-0.5 sm:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-lg px-3 py-1.5 text-[14px] transition hover:text-ink ${path === n.href ? "text-ink" : "text-ink/55"}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:ml-3">
          {!unlocked && (
            <Link href="/support" className={btn("primary", "sm")}>
              Unlock
            </Link>
          )}
          {configured && !user && (
            <button type="button" onClick={signIn} className={btn("ghost", "sm")}>
              Sign in
            </button>
          )}
          {user && (
            <div className="relative" ref={accountRef}>
              <button type="button" onClick={() => setAccount((v) => !v)} className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-hair-strong transition hover:ring-white/30" aria-label="Account" aria-expanded={account}>
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-ant-a/15 text-sm font-semibold text-ant-a">{user.name[0]}</span>
                )}
              </button>
              {account && (
                <div className="enter absolute right-0 top-11 w-60 overflow-hidden rounded-2xl border border-hair bg-navy-850 text-sm shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)]" style={{ animationDuration: "0.22s" }}>
                  <div className="border-b border-hair px-4 py-3">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] tracking-[0.08em] text-ink/45">
                      {supporter?.active ? `SUPPORTER · ${supporter.months} MO` : isAdmin ? "ADMIN · FULL LAB" : "FREE PLAYER"}
                    </p>
                  </div>
                  <div className="p-1.5">
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setAccount(false)} className="flex items-center justify-between rounded-lg px-3 py-2 text-gold transition hover:bg-white/[0.04]">
                        Admin <Icon.Chevron size={14} />
                      </Link>
                    )}
                    <Link href="/support" onClick={() => setAccount(false)} className="flex items-center justify-between rounded-lg px-3 py-2 text-ink/80 transition hover:bg-white/[0.04]">
                      Your badge <Icon.Chevron size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setAccount(false);
                        signOut();
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-ink/50 transition hover:bg-white/[0.04] hover:text-ink/80"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-hair-strong text-ink/80 transition active:scale-95 sm:hidden"
            aria-label="Menu"
            aria-expanded={menu}
          >
            <Icon.Menu size={18} />
          </button>
        </div>
      </div>

      {menu && (
        <nav className="enter border-t border-hair bg-navy-900 px-4 pb-4 pt-1 sm:hidden" style={{ animationDuration: "0.22s" }}>
          {NAV.map((n, i) => (
            <Link key={n.href} href={n.href} onClick={() => setMenu(false)} className="flex items-center gap-4 border-b border-hair py-3.5 text-[16px] font-medium">
              <span className="font-mono text-[11px] text-ink/30">{String(i + 1).padStart(2, "0")}</span>
              {n.label}
              <Icon.Chevron size={16} className="ml-auto text-ink/30" />
            </Link>
          ))}
          <div className="flex gap-5 pt-3 font-mono text-[11px] tracking-[0.08em] text-ink/40">
            <Link href="/privacy" onClick={() => setMenu(false)}>
              PRIVACY
            </Link>
            <Link href="/terms" onClick={() => setMenu(false)}>
              TERMS
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
