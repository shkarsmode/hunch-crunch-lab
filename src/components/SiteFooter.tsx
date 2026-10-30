"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Crunchy from "@/components/Crunchy";
import { CHANNEL_URL } from "@/lib/site";

export default function SiteFooter() {
  const path = usePathname();
  if (path.startsWith("/lab/") || path === "/design") return null;
  return (
    <footer className="mt-24 border-t border-hair">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3">
          <Crunchy size={34} mood="squint" shadow={false} />
          <div>
            <p className="text-[15px] font-semibold tracking-[-0.01em]">Got a hunch? Let&apos;s crunch it.</p>
            <p className="font-mono text-[10px] tracking-[0.1em] text-ink/35">EVERY SIMULATION HERE IS OUR OWN CODE</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] tracking-[0.08em] text-ink/45 sm:ml-auto">
          <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="transition hover:text-ink">
            YOUTUBE ↗
          </a>
          <Link href="/ideas" className="transition hover:text-ink">
            IDEAS
          </Link>
          <Link href="/support" className="transition hover:text-ink">
            SUPPORT
          </Link>
          <Link href="/privacy" className="transition hover:text-ink">
            PRIVACY
          </Link>
          <Link href="/terms" className="transition hover:text-ink">
            TERMS
          </Link>
        </nav>
      </div>
    </footer>
  );
}
