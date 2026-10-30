import type { Analysis, FlipCount, Judged, Level, Side } from "./engine";

export type Phase = "typing" | "crunching" | "result";

export type State = {
  id: number;
  n: FlipCount;
  level: Level;
  flips: string;
  phase: Phase;
  analysis: Analysis | null;
  real: Judged | null;
  streak: number;
  ended: number;
};

export type Action =
  | { type: "flip"; side: Side }
  | { type: "undo" }
  | { type: "clear" }
  | { type: "analyzed"; analysis: Analysis }
  | { type: "revealed" }
  | { type: "real"; run: Judged }
  | { type: "next"; n: FlipCount; level: Level; keep: boolean };

export const initial: State = {
  id: 0,
  n: 20,
  level: "standard",
  flips: "",
  phase: "typing",
  analysis: null,
  real: null,
  streak: 0,
  ended: 0,
};

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "flip": {
      if (s.phase !== "typing" || s.flips.length >= s.n) return s;
      const flips = s.flips + a.side;
      return { ...s, flips, phase: flips.length >= s.n ? "crunching" : "typing" };
    }
    case "undo":
      if (s.phase !== "typing" || !s.flips) return s;
      return { ...s, flips: s.flips.slice(0, -1) };
    case "clear":
      if (s.phase !== "typing" || !s.flips) return s;
      return { ...s, flips: "" };
    case "analyzed":
      if (s.phase !== "crunching" || s.analysis) return s;
      return { ...s, analysis: a.analysis };
    case "revealed": {
      if (s.phase !== "crunching" || !s.analysis) return s;
      const fooled = !s.analysis.you.caught;
      return { ...s, phase: "result", streak: fooled ? s.streak + 1 : 0, ended: fooled ? 0 : s.streak };
    }
    case "real":
      if (s.phase !== "result") return s;
      return { ...s, real: a.run };
    case "next":
      return {
        id: s.id + 1,
        n: a.n,
        level: a.level,
        flips: "",
        phase: "typing",
        analysis: null,
        real: null,
        streak: a.keep ? s.streak : 0,
        ended: 0,
      };
  }
}
