"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Crunchy from "@/components/Crunchy";
import { CHANNEL_URL } from "@/lib/site";

export default function SiteFooter() {
  const path = usePathname();
  if (path.startsWith("/lab/") || path === "/design") return null;
  return (
    <footer className="mt-24 border-t border-edge/15">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Crunchy size={40} mood="squint" />
          <div>
            <p className="display font-black">Got a hunch? Let&apos;s crunch it.</p>
            <p className="text-sm text-mist">Every simulation here is our own code.</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-mist sm:ml-auto">
          <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="hover:text-ink">YouTube</a>
          <Link href="/ideas" className="hover:text-ink">Ideas</Link>
          <Link href="/support" className="hover:text-ink">Support</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
