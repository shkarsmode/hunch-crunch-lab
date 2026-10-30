"use client";

import { useCallback, useState } from "react";
import AntsPreview from "@/components/labs/ants/AntsPreview";
import { Readout } from "@/components/ui/kit";

const fmt = (n: number) => n.toLocaleString("en-US");

export default function LiveAnts({ className = "" }: { className?: string }) {
  const [step, setStep] = useState(0);
  const [home, setHome] = useState(false);
  const onStep = useCallback((s: number, h: boolean) => {
    setStep(s);
    setHome(h);
  }, []);

  return (
    <div className={`relative overflow-hidden bg-[#05060B] ${className}`}>
      <AntsPreview className="absolute inset-0" onStep={onStep} warm={2600} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy-900/90 to-transparent lg:hidden" />
      <div className="absolute left-3 top-3 flex gap-1.5">
        <Readout label="STEP" value={fmt(step)} />
        <Readout label="HOME AT" value="84,876" tone="text-gold" />
      </div>
      <div
        className={`absolute right-3 top-3 rounded-md px-2 py-1 font-mono text-[10px] tracking-[0.1em] ring-1 transition duration-300 ${home ? "bg-mint/15 text-mint ring-mint/30" : "bg-black/50 text-ink/45 ring-white/10"}`}
      >
        {home ? "GRID CLEAN" : "NOT A VIDEO"}
      </div>
    </div>
  );
}
