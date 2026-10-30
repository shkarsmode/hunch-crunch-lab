import type { CrunchyMood } from "@/components/Crunchy";
import type { Settled } from "./director";
import { fmt } from "./config";
import { packChance, type Spec } from "./math";

export type Line = { mood: CrunchyMood; markup: string; important: boolean; banner?: string };

export function percent(q: number) {
  return `${(q * 100).toFixed(q < 0.1 ? 1 : 0)}%`;
}

const MILESTONES: { at: number; markup: string; mood: CrunchyMood }[] = [
  { at: 0.5, markup: "[m]Halfway.[/]|New ones get scarce.", mood: "smirk" },
  { at: 0.75, markup: "[c]75%.[/] Every new|one is a hunt.", mood: "squint" },
  { at: 0.9, markup: "[r]90%![/]|Doubles everywhere.", mood: "squint" },
];

export function talk(s: Settled, spec: Spec, seen: Set<number>, left: { mc: number; mr: number }, easy: number): Line {
  const n = spec.n;
  if (s.done) return { mood: "grin", markup: "[m]Album[/] complete!", important: true };
  if (left.mc + left.mr === 1) {
    return { mood: "squint", markup: `[r]One left![/]|[g]${percent(packChance(spec, left.mr === 1))}[/] per pack.`, important: true };
  }
  if (s.rare.length > 0) {
    const markup = s.rare.length === 1 ? `[g]Rare #${s.rare[0] + 1}![/]|5× less often.` : `[g]${s.rare.length} rares![/]|Shiny.`;
    return { mood: "wow", markup, important: true };
  }
  if (!seen.has(0) && s.after.packs >= easy) {
    seen.add(0);
    const pct = Math.round((100 * s.after.owned) / n);
    return { mood: "squint", markup: `[c]${fmt(easy)}[/] packs in:|only [r]${pct}%[/] full.`, important: true, banner: `${fmt(easy)} PACKS · ONLY ${pct}% FULL` };
  }
  const frac = s.after.owned / n;
  for (const m of MILESTONES) {
    if (frac >= m.at && !seen.has(m.at)) {
      seen.add(m.at);
      return { mood: m.mood, markup: m.markup, important: true };
    }
  }
  const swapped = s.swapsIn > 0 ? `, [c]${s.swapsIn}[/] swapped` : "";
  if (s.packs > 1) {
    if (s.fresh === 0) return { mood: "frown", markup: `[r]${s.packs}[/] packs,|nothing new. Ouch.`, important: false };
    const good = s.fresh / Math.max(1, s.fresh + s.dups) > 0.5;
    return { mood: good ? "grin" : "smirk", markup: `[c]${s.packs}[/] packs: [m]${fmt(s.fresh)}[/] new,|[r]${fmt(s.dups)}[/] doubles${swapped}.`, important: false };
  }
  if (s.fresh === 0) return { mood: "frown", markup: `[r]All doubles.[/]|Ouch.`, important: false };
  if (s.dups === 0) return { mood: "grin", markup: `[m]All new![/]|Enjoy it.`, important: false };
  return { mood: s.swapsIn > 0 ? "grin" : "smirk", markup: `[g]+${s.fresh}[/] new,|[r]${s.dups}[/] double${s.dups > 1 ? "s" : ""}${swapped}.`, important: false };
}
