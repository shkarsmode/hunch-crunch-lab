"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Crunchy from "@/components/Crunchy";
import { useAccess, LockIcon } from "@/components/access/AccessProvider";
import { shortUrl } from "@/lib/site";

export default function LabShell({
  title,
  shortTitle,
  emoji,
  video,
  children,
  right,
}: {
  title: string;
  shortTitle?: string;
  emoji: string;
  video?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  const { unlocked, upsell } = useAccess();
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-navy-900 pt-[env(safe-area-inset-top)]">
      <div className="pointer-events-none absolute inset-0 lab-grid opacity-60" />
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 px-3">
        <Link href="/#lab" className="flex h-10 items-center gap-1.5 rounded-full pl-2 pr-3 text-sm font-semibold text-mist ring-1 ring-edge/25 transition hover:text-ink active:scale-95" aria-label="Back to the lab">
          <span aria-hidden>←</span>
          <Crunchy size={22} shadow={false} blink={false} />
        </Link>
        <h1 className="display min-w-0 flex-1 truncate text-[15px] font-black sm:text-lg">
          <span className="mr-1">{emoji}</span>
          {shortTitle ? (
            <>
              <span className="sm:hidden">{shortTitle}</span>
              <span className="hidden sm:inline">{title}</span>
            </>
          ) : (
            title
          )}
        </h1>
        {right}
        {video && (
          <a href={shortUrl(video)} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full text-coral ring-1 ring-edge/25 transition hover:bg-coral/10 active:scale-95" aria-label="Watch the video">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
            </svg>
          </a>
        )}
        {!unlocked && (
          <button type="button" onClick={() => upsell()} className="flex h-10 items-center gap-1 rounded-full bg-gold px-3 text-sm font-black text-navy-950 active:scale-95">
            <LockIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Unlock all</span>
            <span className="sm:hidden">$3</span>
          </button>
        )}
      </header>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}
