"use client";

import { useSyncExternalStore } from "react";
import Emblem from "./Emblem";
import { TIERS } from "@/lib/tiers";
import VariantA from "./VariantA";
import VariantB from "./VariantB";
import VariantC from "./VariantC";

const VARIANTS = [
  { id: "a", letter: "A", name: "Instrument", note: "Strict and technical: hairlines, mono numbers, one gold accent", View: VariantA },
  { id: "b", letter: "B", name: "Playful", note: "Soft glass, big radii, Crunchy up front, springy taps", View: VariantB },
  { id: "c", letter: "C", name: "Editorial", note: "Big type, numbers as heroes, numbered sections", View: VariantC },
];

const onHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const WIDE = "(min-width: 1180px)";
const onWide = (cb: () => void) => {
  const m = window.matchMedia(WIDE);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export default function DesignBoard() {
  const hash = useSyncExternalStore(onHash, () => window.location.hash.slice(1), () => "");
  const wide = useSyncExternalStore(onWide, () => window.matchMedia(WIDE).matches, () => false);
  const index = Math.max(0, VARIANTS.findIndex((v) => v.id === hash));

  if (wide) {
    return (
      <div className="min-h-screen bg-[#04060B] px-8 py-10">
        <div className="mx-auto mb-8 max-w-[1260px] text-center">
          <h1 className="text-2xl font-black tracking-[-0.03em] text-white">Three directions for Hunch Crunch Lab</h1>
          <p className="mt-1 text-sm text-white/50">Each phone scrolls on its own. Everything is live: tap the controls, flip the rules, pick a tier.</p>
        </div>
        <div className="mx-auto mb-12 flex max-w-[1060px] items-end justify-between rounded-[32px] border border-white/[0.07] bg-white/[0.02] px-10 py-8">
          {TIERS.map((t, i) => (
            <div key={t.id} className="text-center">
              <Emblem tier={t.id} size={132} founder={i === 0} className="mx-auto" />
              <div className="mt-3 text-[15px] font-black text-white">{t.name}</div>
              <div className="text-[12px] text-white/45">
                {t.months} {t.months === 1 ? "month" : "months"}
                {i === 0 ? " · founder ring" : ""}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-[1260px] justify-center gap-8">
          {VARIANTS.map(({ id, letter, name, note, View }) => (
            <div key={id} className="flex flex-col items-center">
              <div className="mb-3 text-center">
                <div className="text-[15px] font-black text-white">
                  {letter} · {name}
                </div>
                <div className="max-w-[340px] text-[12px] text-white/45">{note}</div>
              </div>
              <div className="no-scrollbar relative h-[844px] w-[390px] overflow-y-auto rounded-[46px] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9),0_0_0_10px_#12151D,0_0_0_11px_rgb(255_255_255/0.08)]">
                <View />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { View } = VARIANTS[index];
  return (
    <div className="relative">
      <View key={VARIANTS[index].id} />
      <nav className="fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-50 mx-auto flex w-fit gap-1 rounded-full border border-white/15 bg-black/75 p-1 shadow-2xl backdrop-blur-xl">
        {VARIANTS.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              window.location.hash = v.id;
              window.scrollTo({ top: 0 });
            }}
            className={`h-10 rounded-full px-3.5 text-[13px] font-bold transition ${i === index ? "bg-white text-black" : "text-white/70"}`}
          >
            {v.letter} · {v.name}
          </button>
        ))}
      </nav>
    </div>
  );
}
