import { Fragment } from "react";
import { EXTRA, SEMI, V, u } from "./scene";

const TAG = /\[(\w)\](.*?)\[\/\]/g;
const COLORS: Record<string, string> = { g: V.gold, c: V.cyan, r: V.coral, m: V.mint, w: V.white };

type Piece = { text: string; color: string; glue: boolean };

function parseLine(markup: string): Piece[] {
  const out: Piece[] = [];
  let pos = 0;
  let last = " ";
  const add = (seg: string, color: string) => {
    if (!seg) return;
    seg
      .split(/\s+/)
      .filter(Boolean)
      .forEach((text, j) => out.push({ text, color, glue: j === 0 && out.length > 0 && !/^\s/.test(seg) && !/\s/.test(last) }));
    last = seg[seg.length - 1];
  };
  for (const m of markup.matchAll(TAG)) {
    const at = m.index ?? 0;
    add(markup.slice(pos, at), V.white);
    add(m[2], COLORS[m[1]] ?? V.white);
    pos = at + m[0].length;
  }
  add(markup.slice(pos), V.white);
  return out;
}

export function Caption({ markup, sub, stagger = 55 }: { markup: string; sub?: string; stagger?: number }) {
  const parts = markup.split("|");
  const lines = parts.map(parseLine);
  const visible = Math.max(...parts.map((p) => p.replace(TAG, "$2").length));
  const size = visible <= 17 ? 86 : visible <= 21 ? 80 : 72;
  const starts = lines.map((_, i) => lines.slice(0, i).reduce((n, l) => n + l.length, 0));
  return (
    <div className="mx-auto text-center" style={{ maxWidth: u(930), paddingTop: u(40) }}>
      {lines.map((line, li) => (
        <div key={li} style={{ ...EXTRA, fontSize: u(size), lineHeight: 1.13, color: V.white }}>
          {line.map((w, i) => (
            <Fragment key={i}>
              {i > 0 && !w.glue ? " " : null}
              <span
                className="inline-block animate-pop"
                style={{
                  color: w.color,
                  textShadow: `0 ${u(size * 0.05)} ${u(size * 0.24)} rgb(0 0 0 / 0.6)`,
                  animationDuration: "340ms",
                  animationDelay: `${(starts[li] + i) * stagger}ms`,
                }}
              >
                {w.text}
              </span>
            </Fragment>
          ))}
        </div>
      ))}
      {sub ? (
        <p className="animate-rise" style={{ ...SEMI, fontSize: u(44), lineHeight: 1.25, color: V.rim, marginTop: u(14), animationDelay: "260ms", textShadow: `0 ${u(2)} ${u(16)} rgb(0 0 0 / 0.55)` }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}
