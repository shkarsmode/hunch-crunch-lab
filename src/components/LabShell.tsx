"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import Crunchy from "@/components/Crunchy";
import { useAccess, LockIcon } from "@/components/access/AccessProvider";
import { Icon } from "@/components/ui/icons";
import { shortUrl } from "@/lib/site";

export default function LabShell({
  title,
  shortTitle,
  tag,
  video,
  children,
  right,
  grid = true,
}: {
  title: string;
  shortTitle?: string;
  tag?: string;
  emoji?: string;
  video?: string;
  children: ReactNode;
  right?: ReactNode;
  grid?: boolean;
}) {
  const { unlocked, upsell } = useAccess();

  // Labs are full-screen apps: no rubber-band bounce or pull-to-refresh while you drag the grid.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overscrollBehavior;
    html.style.overscrollBehavior = "none";
    return () => {
      html.style.overscrollBehavior = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-navy-900 pt-[env(safe-area-inset-top)]">
      {grid && <div className="pointer-events-none absolute inset-0 lab-grid opacity-60" />}
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 border-b border-hair bg-navy-900 px-3">
        <Link
          href="/#lab"
          className="flex h-10 items-center gap-1 rounded-xl border border-hair-strong pl-1.5 pr-2.5 text-ink/70 transition hover:text-ink active:scale-95"
          aria-label="Back to the lab"
        >
          <Icon.Chevron size={16} className="rotate-180" />
          <Crunchy size={22} shadow={false} blink={false} />
        </Link>
        <div className="min-w-0 flex-1 pl-1">
          <h1 className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] sm:text-[17px]">
            {shortTitle ? (
              <>
                <span className="sm:hidden">{shortTitle}</span>
                <span className="hidden sm:inline">{title}</span>
              </>
            ) : (
              title
            )}
          </h1>
          {tag && <p className="truncate font-mono text-[9px] tracking-[0.12em] text-ink/40">{tag}</p>}
        </div>
        {right}
        {video && (
          <a
            href={shortUrl(video)}
            target="_blank"
            rel="noreferrer"
            className="grid h-10 w-10 place-items-center rounded-xl border border-hair-strong text-ink/70 transition hover:text-ink active:scale-95"
            aria-label="Watch the video"
          >
            <Icon.Youtube size={19} />
          </a>
        )}
        {!unlocked && (
          <button
            type="button"
            onClick={() => upsell()}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-gold px-3 text-[13px] font-semibold text-[#0B0D12] shadow-[0_0_0_1px_rgb(255_201_74/0.45)] transition hover:bg-gold-hi active:scale-95"
          >
            <LockIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Unlock all</span>
            <span className="sm:hidden">$3</span>
          </button>
        )}
      </header>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}
