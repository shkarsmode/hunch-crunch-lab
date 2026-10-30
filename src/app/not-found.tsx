import Link from "next/link";
import Crunchy from "@/components/Crunchy";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-20 text-center">
      <Crunchy size={96} mood="frown" />
      <p className="display mt-4 text-6xl font-black text-shine">404</p>
      <p className="display mt-2 text-2xl font-black">Not even a one-in-a-million chance.</p>
      <p className="mt-2 text-mist">This page doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 rounded-2xl bg-gold px-6 py-3 font-black text-navy-950 active:scale-95">Back to the lab</Link>
    </div>
  );
}
