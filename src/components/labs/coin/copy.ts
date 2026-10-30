import { COINS, exactTail, expectedSwitches, fmt, oneIn } from "./engine";
import type { Analysis, Judged, Tell } from "./engine";

export const LESSON = "A real coin has no memory. People switch too often and dodge long runs.";

export type Words = { head: string; line: string; facts: string; cap: string };

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function valueText(t: Tell, n: number): string {
  if (t.metric === "switches") return `${t.value} ${t.value === 1 ? "switch" : "switches"} in ${n} flips`;
  return `longest streak: ${t.value} in a row`;
}

function phrase(t: Tell): string {
  if (t.metric === "switches") return t.dir === "high" ? "switched that often" : "switched that rarely";
  return t.dir === "high" ? "streaked that long" : "stayed that short";
}

export function reach(t: Tell): string {
  const c = t.dir === "high" ? t.atLeast : t.atMost;
  const head = c === 0 ? "Not one" : `Only ${fmt(c)}`;
  return `${head} of ${fmt(COINS)} real coins ${phrase(t)}.`;
}

function odds(t: Tell, n: number): string {
  const c = t.dir === "high" ? t.atLeast : t.atMost;
  if (c !== 0) return "";
  const p = exactTail(n, t.metric, t.value, t.dir);
  if (!(p > 0) || p >= 1) return "";
  return ` A real coin does that about once in ${oneIn(p)} tries.`;
}

function alsoText(t: Tell): string {
  if (t.metric === "switches") return `Your ${t.value} switches are rare too.`;
  return `Your longest streak of ${t.value} is rare too.`;
}

export function pctText(p: number): string {
  const v = p * 100;
  if (v >= 10) return `${Math.round(v)}%`;
  return `${Math.round(v * 10) / 10}%`;
}

export function words(a: Analysis, j: Judged): Words {
  const n = a.n;
  const fooled = `You fooled ${fmt(COINS)} coins.`;
  const fooledCap = `You fooled [m]${fmt(COINS)}[/] coins.`;
  const caught = `${cap(valueText(j.lead, n))}. ${reach(j.lead)}${odds(j.lead, n)}${j.also ? ` ${alsoText(j.also)}` : ""}`;
  switch (j.tone) {
    case "smooth":
      return { head: "Too smooth.", cap: "[r]Too smooth.[/]", line: "Real coins streak more.", facts: caught };
    case "streaky":
      return { head: "Too streaky.", cap: "[r]Too streaky.[/]", line: "A real coin switches about half the time.", facts: caught };
    case "short":
      return { head: "No long streaks.", cap: "[r]No long streaks.[/]", line: "Real coins run into them.", facts: caught };
    case "long":
      return { head: "That streak is too long.", cap: "[r]That streak[/]|[r]is too long.[/]", line: "Real coins streak, just not that far.", facts: caught };
    case "close":
      return {
        head: fooled,
        cap: fooledCap,
        line: "Just barely. That was close.",
        facts: `${j.sw.value} switches, longest streak ${j.ru.value}. About ${Math.max(1, Math.round(j.lead.odd * 100))} in 100 real coins look this odd, so the detector let you through.`,
      };
    default:
      return {
        head: fooled,
        cap: fooledCap,
        line: "Your flips look just like a real coin's.",
        facts: `${j.sw.value} switches and a longest streak of ${j.ru.value}. Real coins average ${expectedSwitches(n).toFixed(1)} switches. Nine in ten have a longest streak of ${a.ru.p5} to ${a.ru.p95}.`,
      };
  }
}

export function realWords(a: Analysis, r: Judged): { head: string; line: string } {
  const base = `${r.sw.value} switches, longest streak ${r.ru.value}.`;
  if (!r.caught) return { head: "Passed.", line: `${base} This detector lets about ${pctText(1 - a.falseAlarm)} of real coins through.` };
  return { head: "Flagged!", line: `${base} This detector calls about ${pctText(a.falseAlarm)} of real coins fake.` };
}

export function shareLine(a: Analysis, j: Judged, url: string, streak: number): string {
  if (!j.caught) {
    const run = streak > 1 ? ` That is ${streak} rounds in a row.` : "";
    return `🪙 I typed ${a.n} coin flips and fooled ${fmt(COINS)} simulated real coins (${j.sw.value} switches, longest streak ${j.ru.value}).${run} Can you fake a coin? ${url}`;
  }
  return `🪙 A real-coin detector caught my fake flips. ${cap(valueText(j.lead, a.n))}. ${reach(j.lead)} Can you do better? ${url}`;
}

export function hintCaption(len: number, n: number): { key: string; cap: string; sub?: string } {
  const left = n - len;
  if (len === 0) return { key: "start", cap: `Make [g]${n} flips[/]|that look like a [m]real coin[/].`, sub: "Tap H or T, no planning." };
  if (left === 1) return { key: "last", cap: "Last one.|[g]Lock it in![/]" };
  const r = len / n;
  if (r < 0.25) return { key: "early", cap: "Go on.|A real coin has [g]no plan[/]." };
  if (r < 0.5) return { key: "mid", cap: "Keep it [g]messy[/]." };
  if (r < 0.75) return { key: "half", cap: "[g]Halfway[/] there.|Trust your gut." };
  return { key: "late", cap: `[g]${left}[/] to go.|Don't overthink it.` };
}
