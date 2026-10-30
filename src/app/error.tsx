"use client";

import Crunchy from "@/components/Crunchy";
import { btn } from "@/components/ui/kit";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-20 text-center">
      <Crunchy size={84} mood="wow" shadow={false} />
      <p className="mt-6 font-mono text-[11px] tracking-[0.12em] text-ink/40">ERROR · OUR FAULT</p>
      <h1 className="headline mt-2 text-[32px] leading-tight">Something broke.</h1>
      <p className="mt-2 text-[15px] text-ink/55">Give it another go.</p>
      <button type="button" onClick={reset} className={btn("primary", "lg", "mt-7 px-7")}>
        Try again
      </button>
    </div>
  );
}
