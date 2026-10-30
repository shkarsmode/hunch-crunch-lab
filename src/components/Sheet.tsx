"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/ui/icons";

export default function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close"
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 lg:hidden ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label={title}
        inert={!open}
        className={`glass absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-[22px] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl transition-transform duration-300 ease-out no-scrollbar lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-18 lg:max-h-none lg:w-[380px] lg:rounded-[22px] ${
          open ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-x-[110%] lg:translate-y-0"
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/15 lg:hidden" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{title}</h2>
          <button type="button" onClick={onClose} tabIndex={open ? 0 : -1} className="grid h-9 w-9 place-items-center rounded-lg text-ink/45 transition hover:bg-white/5 hover:text-ink" aria-label="Close">
            <Icon.Close size={18} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
