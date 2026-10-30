import type { CSSProperties } from "react";

export const VW = 1080;
export const Y0 = 190;
export const Y1 = 1545;
export const VH = Y1 - Y0;

export const INK = "#0A0F1F";
export const GOLD = "#FFC94A";
export const CYAN = "#3FE0FF";
export const CORAL = "#FF5C7A";
export const MINT = "#3EE6A0";
export const WHITE = "#F4F6FB";
export const MUTED = "#8D9AB8";
export const SOFT = "#A9B6D3";
export const PANEL = "#121B38";
export const PANEL_LINE = "#2B3B66";
export const SLOT = "#1B2647";
export const CARD = "#0B1124";
export const DEEP = "#0C1430";
export const PILE_TILE = "#4A5A85";
export const FLY_DUP = "#6B7AA3";

export const PAL = [GOLD, CYAN, CORAL, MINT, "#B48CFF", "#FF9F43", WHITE, "#4D8BFF"];

export const TAGS: Record<string, string> = { g: GOLD, c: CYAN, r: CORAL, m: MINT, w: WHITE };

export const ALBUM = { x: 68, y: 538, w: 942.5, h: 802, r: 26 };
export const GRID = { x: 94, y: 600, w: 889.5, h: 711, gap: 3 / 25.5 };
export const PACK = { x: 540, y: 1440, w: 110, h: 150 };
export const PILE = { x: 905, y: 1445 };
export const MOUTH_Y = 1400;
export const CRUNCHY = { x: 180, y: 1470 };
export const COUNT_X = [180, 540, 900];
export const CAP_Y = 300;
export const PILL_Y = 398;
export const PRICE = 2;

export const DISPLAY: CSSProperties = { fontWeight: 800, fontVariationSettings: '"opsz" 32' };
export const LABEL: CSSProperties = { fontWeight: 600, fontVariationSettings: '"opsz" 14' };

export const BASELINE = 0.864;

export function shadow(size: number, a = 0.55) {
  return `0 ${(size * 0.05).toFixed(2)}px ${(size * 0.24).toFixed(2)}px rgba(0,0,0,${a})`;
}

export function rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function mixHex(a: string, b: string, t: number) {
  const k = Math.min(1, Math.max(0, t));
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

export type Word = { text: string; color: string; glue: boolean };

export function parseCaption(markup: string): Word[][] {
  return markup.split("|").map((part) => {
    const out: Word[] = [];
    let last = " ";
    const add = (seg: string, color: string) => {
      if (!seg) return;
      seg
        .split(/\s+/)
        .filter(Boolean)
        .forEach((w, j) => {
          out.push({ text: w, color, glue: j === 0 && out.length > 0 && !/^\s/.test(seg) && !/\s/.test(last) });
        });
      last = seg[seg.length - 1];
    };
    let pos = 0;
    for (const m of part.matchAll(/\[(\w)\](.*?)\[\/\]/g)) {
      const at = m.index ?? 0;
      add(part.slice(pos, at), WHITE);
      add(m[2], TAGS[m[1]] ?? WHITE);
      pos = at + m[0].length;
    }
    add(part.slice(pos), WHITE);
    return out;
  });
}

export function plain(markup: string) {
  return markup.replace(/\[\w\](.*?)\[\/\]/g, "$1").replace(/\|/g, " ");
}

export function captionSize(markup: string) {
  const visible = markup.replace(/\[\w\](.*?)\[\/\]/g, "$1").split("|");
  const longest = Math.max(...visible.map((l) => l.length));
  const base = longest <= 17 ? 86 : longest <= 21 ? 80 : 72;
  return visible.length > 1 ? Math.min(base, 80) : base;
}
