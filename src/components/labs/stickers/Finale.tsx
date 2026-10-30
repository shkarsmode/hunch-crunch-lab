"use client";

import Crunchy from "@/components/Crunchy";
import { LockIcon } from "@/components/access/AccessProvider";
import { shortUrl } from "@/lib/site";
import { VIDEO, VIDEO_ID, fmt, fmtPacks, tap } from "./config";
import { harmonic, type Spec } from "./math";

type Props = {
  packs: number;
  spec: Spec;
  expected: number;
  easy: number;
  friends: number;
  swapEst: number | null;
  unlocked: boolean;
  onAgain: () => void;
  onSim: () => void;
  onUpsell: (reason: string) => void;
};

function verdict(packs: number, expected: number) {
  const luck = packs / expected - 1;
  if (Math.abs(luck) < 0.05) return "Right on the average. Statistically boring, in the best way.";
  if (luck < 0) return `${Math.round(-luck * 100)}% fewer packs than the average collector. Lucky you!`;
  return `${Math.round(luck * 100)}% more packs than the average collector. The last few are brutal.`;
}

export default function Finale({ packs, spec, expected, easy, friends, swapEst, unlocked, onAgain, onSim, onUpsell }: Props) {
  const h = harmonic(spec.n);
  const draws = spec.n * h;
  const uniform = spec.nr === 0;
  return (
    <div className="absolute inset-0 z-20 grid place-items-center overflow-y-auto bg-navy-950/65 px-3 pb-3 pt-14 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Album complete">
      <div className="glass animate-pop relative my-auto w-full max-w-sm rounded-3xl p-4 text-center shadow-2xl sm:p-5">
        <div className="-mt-12 flex justify-center">
          <Crunchy size={92} mood="grin" className="animate-wiggle drop-shadow-[0_8px_18px_rgba(255,201,74,0.35)]" />
        </div>
        <h2 className="display text-shine mt-1 text-[28px] font-black leading-8">Album complete!</h2>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="rounded-xl bg-navy-950/60 px-1 py-2 ring-1 ring-mint/40">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist">You</p>
            <p className="display num text-2xl font-black text-mint">{fmt(packs)}</p>
            <p className="text-[10px] text-mist">packs</p>
          </div>
          <div className="rounded-xl bg-navy-950/60 px-1 py-2 ring-1 ring-gold/40">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist">Expected</p>
            <p className="display num text-2xl font-black text-gold">≈ {fmtPacks(expected)}</p>
            <p className="text-[10px] text-mist">packs</p>
          </div>
          <div className="rounded-xl bg-navy-950/60 px-1 py-2 ring-1 ring-cyan/40">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist">Easy math</p>
            <p className="display num text-2xl font-black text-cyan">{fmt(easy)}</p>
            <p className="text-[10px] text-mist">packs</p>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold text-ink">{verdict(packs, expected)}</p>
        <p className="mt-1 text-xs text-mist">
          At ${VIDEO.price} a pack, like in the video, that&apos;s ${fmt(packs * VIDEO.price)}. Easy math said ${fmt(easy * VIDEO.price)}.
        </p>
        <div className="mt-3 rounded-2xl bg-navy-950/55 p-3 text-left text-[13px] leading-snug text-mist ring-1 ring-edge/20">
          <p>
            <span className="font-bold text-ink">Why?</span> Each new sticker is harder to find than the last.
          </p>
          {uniform ? (
            <p className="mt-1.5">
              On average you need <span className="font-bold text-gold">n × H(n)</span> stickers, where H(n) = 1 + ½ + ⅓ + … + 1/n. Here: {fmt(spec.n)} × {h.toFixed(2)} ≈ {fmt(Math.round(draws))} stickers, so ≈ {fmtPacks(expected)} packs of {spec.k}.
            </p>
          ) : (
            <p className="mt-1.5">
              Rare stickers turn up 5× less often, so the last ones take even longer: ≈ {fmtPacks(expected)} packs on average for this album.
            </p>
          )}
          {friends > 0 && swapEst !== null && (
            <p className="mt-1.5">
              With {friends} friend{friends > 1 ? "s" : ""} swapping doubles it takes ≈ <span className="font-bold text-cyan">{fmt(Math.round(swapEst))}</span> packs each.
            </p>
          )}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => {
              tap();
              onAgain();
            }}
            className="h-12 rounded-2xl bg-gold px-4 text-base font-black text-navy-950 shadow-[0_0_28px_-8px_#ffc94a] transition active:scale-[0.97]"
          >
            Play again
          </button>
          <button
            type="button"
            onClick={() => {
              tap();
              if (unlocked) onSim();
              else onUpsell("The 10,000-album simulator");
            }}
            className="flex h-12 items-center gap-1.5 rounded-2xl px-3.5 text-sm font-bold text-ink ring-1 ring-edge/40 transition active:scale-[0.97]"
          >
            {!unlocked && <LockIcon className="h-4 w-4 text-gold" />}
            10,000 albums
          </button>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs">
          <a href={shortUrl(VIDEO_ID)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center text-coral underline-offset-4 hover:underline">
            Watch the video
          </a>
          {!unlocked && (
            <button type="button" onClick={() => onUpsell("Albums up to 980 stickers")} className="inline-flex h-11 items-center text-gold underline-offset-4 hover:underline">
              Try the 980-sticker album
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] text-mist/70">Album idea from @maximbarishov4120. Thank you!</p>
      </div>
    </div>
  );
}
