import Link from "next/link";
import { ACCENT_HEX, type Experiment } from "@/lib/experiments";
import { shortUrl } from "@/lib/site";

export default function ExperimentCard({ e, i }: { e: Experiment; i: number }) {
  const c = ACCENT_HEX[e.accent];
  const live = e.status === "live";
  const body = (
    <div
      className={`group relative h-full overflow-hidden rounded-3xl p-5 ring-1 transition duration-300 ${live ? "ring-edge/25 hover:-translate-y-1 hover:ring-2 hover:ring-(--c)" : "ring-edge/15"}`}
      style={{ background: `linear-gradient(160deg, ${c}22, #0f163000 55%), #0f1630cc`, ["--c" as string]: c }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70" style={{ background: c }} />
      <div className="relative flex items-start justify-between">
        <span className="text-4xl transition group-hover:scale-110 group-hover:-rotate-6">{e.emoji}</span>
        {live ? (
          <span className="rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-navy-950" style={{ background: c }}>
            Play
          </span>
        ) : (
          <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-mist">Soon</span>
        )}
      </div>
      <h3 className="display relative mt-4 text-xl font-black">{e.title}</h3>
      <p className="relative mt-1.5 text-sm text-mist">{e.hook}</p>
      {live && e.free && (
        <p className="relative mt-4 text-xs text-mist">
          <span className="font-bold text-mint">Free:</span> {e.free} · <span className="font-bold text-gold">Full:</span> {e.full?.length} more
        </p>
      )}
      {!live && e.video && (
        <a href={shortUrl(e.video)} target="_blank" rel="noreferrer" className="relative mt-4 inline-block text-xs font-bold text-coral hover:underline">
          Watch the video →
        </a>
      )}
    </div>
  );
  return live ? (
    <Link href={`/lab/${e.slug}`} className="block h-full animate-rise focus-visible:outline-2 focus-visible:outline-gold" style={{ animationDelay: `${i * 70}ms` }}>
      {body}
    </Link>
  ) : (
    <div className="h-full animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
      {body}
    </div>
  );
}
