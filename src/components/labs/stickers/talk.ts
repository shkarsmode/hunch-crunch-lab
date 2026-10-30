import type { CrunchyMood } from "@/components/Crunchy";
import type { Settled } from "./director";
import { fmt } from "./config";
import { expectedFill, packChance, type Spec } from "./math";

export type Line = { mood: CrunchyMood; text: string; important: boolean };

export function percent(q: number) {
  return `${(q * 100).toFixed(q < 0.1 ? 1 : 0)}%`;
}

const MILESTONES: { at: number; text: string; mood: CrunchyMood }[] = [
  { at: 0.5, text: "Halfway there. New ones get scarce now.", mood: "smirk" },
  { at: 0.75, text: "75%. Now every new sticker is a hunt.", mood: "squint" },
  { at: 0.9, text: "90%! Doubles everywhere, right?", mood: "squint" },
];

export function talk(s: Settled, spec: Spec, seen: Set<number>, left: { mc: number; mr: number }, easy: number): Line {
  const n = spec.n;
  if (s.done) return { mood: "grin", text: "That's the last one!", important: true };
  if (left.mc + left.mr === 1) {
    return { mood: "squint", text: `One left! Each pack has a ${percent(packChance(spec, left.mr === 1))} shot at it.`, important: true };
  }
  if (s.rare.length > 0) {
    const text = s.rare.length === 1 ? `Rare #${s.rare[0] + 1}! It turns up 5× less often.` : `${s.rare.length} rares at once! Shiny.`;
    return { mood: "wow", text, important: true };
  }
  if (!seen.has(0) && s.after.packs >= easy) {
    seen.add(0);
    return { mood: "squint", text: `Easy math says ${fmt(easy)} packs. Real average: ${Math.round(expectedFill(spec, easy) * 100)}% full.`, important: true };
  }
  const frac = s.after.owned / n;
  for (const m of MILESTONES) {
    if (frac >= m.at && !seen.has(m.at)) {
      seen.add(m.at);
      return { mood: m.mood, text: m.text, important: true };
    }
  }
  const swapped = s.swapsIn > 0 ? ` 🤝 ${s.swapsIn} swapped in.` : "";
  if (s.packs > 1) {
    if (s.fresh === 0) return { mood: "frown", text: `${s.packs} packs, nothing new. Ouch.`, important: false };
    const good = s.fresh / Math.max(1, s.fresh + s.dups) > 0.5;
    return { mood: good ? "grin" : "smirk", text: `${s.packs} packs: ${fmt(s.fresh)} new, ${fmt(s.dups)} doubles.${swapped}`, important: false };
  }
  if (s.fresh === 0) return { mood: "frown", text: `A whole pack of doubles. Ouch.${swapped}`, important: false };
  if (s.dups === 0) return { mood: "grin", text: `All new! Enjoy it while it lasts.${swapped}`, important: false };
  return { mood: s.swapsIn > 0 ? "grin" : "smirk", text: `+${s.fresh} new, ${s.dups} double${s.dups > 1 ? "s" : ""}.${swapped}`, important: false };
}
