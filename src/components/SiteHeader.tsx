"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Crunchy from "@/components/Crunchy";
import { useAccess } from "@/components/access/AccessProvider";

const NAV = [
  { href: "/#lab", label: "Lab" },
  { href: "/ideas", label: "Ideas" },
  { href: "/support", label: "Support" },
];

export default function SiteHeader() {
  const path = usePathname();
  const { user, configured, isAdmin, unlocked, signIn, signOut, supporter } = useAccess();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !menu.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  if (path.startsWith("/lab/") || path === "/design") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-edge/15 bg-navy-900/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="group flex items-center gap-2" aria-label="Hunch Crunch Lab home">
          <Crunchy size={30} shadow={false} className="transition group-hover:-rotate-6 group-active:animate-crunch" />
          <span className="display text-[17px] font-black tracking-tight">
            Hunch Crunch <span className="rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-navy-950">Lab</span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm font-semibold">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`hidden rounded-full px-3 py-1.5 transition hover:bg-ink/5 sm:block ${path === n.href ? "text-gold" : "text-mist"}`}
            >
              {n.label}
            </Link>
          ))}
          {!unlocked && (
            <Link href="/support" className="rounded-full bg-gold px-3 py-1.5 font-black text-navy-950 shadow-[0_0_24px_-6px_#ffc94a] transition active:scale-95 sm:ml-1">
              Unlock
            </Link>
          )}
          {configured && !user && (
            <button type="button" onClick={signIn} className="rounded-full px-3 py-1.5 text-mist ring-1 ring-edge/30 transition hover:text-ink">
              Sign in
            </button>
          )}
          {user && (
            <div className="relative" ref={menu}>
              <button type="button" onClick={() => setOpen((v) => !v)} className="ml-1 flex items-center gap-2 rounded-full p-0.5 ring-1 ring-edge/30" aria-label="Account">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan/20 text-sm font-black text-cyan">{user.name[0]}</span>
                )}
              </button>
              {open && (
                <div className="glass absolute right-0 top-11 w-56 rounded-2xl p-2 text-sm shadow-2xl animate-pop">
                  <p className="truncate px-3 pt-2 font-bold">{user.name}</p>
                  <p className="truncate px-3 pb-2 text-xs text-mist">{supporter?.active ? `Supporter · ${supporter.months} mo` : "Free player"}</p>
                  <Link href="/support" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-ink/5 sm:hidden">Support</Link>
                  <Link href="/ideas" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-ink/5 sm:hidden">Ideas</Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-gold hover:bg-ink/5">Admin</Link>
                  )}
                  <button type="button" onClick={() => { setOpen(false); signOut(); }} className="block w-full rounded-xl px-3 py-2 text-left text-mist hover:bg-ink/5">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
