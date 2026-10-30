import Link from "next/link";
import Crunchy from "@/components/Crunchy";
import { btn } from "@/components/ui/kit";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-20 text-center">
      <Crunchy size={84} mood="frown" shadow={false} />
      <p className="mt-6 font-mono text-[11px] tracking-[0.12em] text-ink/40">404 · PAGE NOT FOUND</p>
      <h1 className="headline mt-2 text-[32px] leading-tight">Not even a one-in-a-million chance.</h1>
      <p className="mt-2 text-[15px] text-ink/55">This page doesn&apos;t exist.</p>
      <Link href="/" className={btn("primary", "lg", "mt-7 px-7")}>
        Back to the lab
      </Link>
    </div>
  );
}
