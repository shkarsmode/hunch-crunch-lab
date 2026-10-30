"use client";

import Crunchy from "@/components/Crunchy";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-20 text-center">
      <Crunchy size={96} mood="wow" />
      <p className="display mt-4 text-2xl font-black">Something broke. Our fault.</p>
      <p className="mt-2 text-mist">Give it another go.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-2xl bg-gold px-6 py-3 font-black text-navy-950 active:scale-95">Try again</button>
    </div>
  );
}
