export const PER = 84876;

const KN: [number, number][] = [
  [0, 10 / 3],
  [10, 10 / 3],
  [2150, 2600],
  [9300, 3600],
  [10150, 520],
  [11190, 520],
  [14200, 7000],
  [41500, 7000],
  [43330, 190],
  [43480, 190],
  [45400, 7000],
  [81800, 7000],
  [84850, 40],
  [PER, 7],
];

const TA0 = 0.02;

function segTime(i: number, k: number) {
  const [k0, r0] = KN[i];
  const [k1, r1] = KN[i + 1];
  if (r1 === r0) return (k - k0) / r0;
  const r = r0 + ((r1 - r0) * (k - k0)) / (k1 - k0);
  return ((k1 - k0) / (r1 - r0)) * Math.log(r / r0);
}

const CUM = [0];
for (let i = 0; i < KN.length - 1; i++) CUM.push(CUM[i] + segTime(i, KN[i + 1][0]));

function segOf(k: number) {
  let i = 0;
  while (i < KN.length - 2 && k >= KN[i + 1][0]) i++;
  return i;
}

export function rateAt(k: number) {
  if (k <= 0) return KN[0][1];
  if (k >= PER) return KN[KN.length - 1][1];
  const i = segOf(k);
  const [k0, r0] = KN[i];
  const [k1, r1] = KN[i + 1];
  return r0 + ((r1 - r0) * (k - k0)) / (k1 - k0);
}

export function timeOf(k: number) {
  const kk = Math.max(0, Math.min(PER, k));
  const i = segOf(kk);
  return TA0 + CUM[i] + segTime(i, kk);
}

const T_HW0 = timeOf(10150);
const T_HW1 = timeOf(11190);
const T_COL = timeOf(43430);
const T_LAST = timeOf(PER - 16);
const T_END = timeOf(PER);

const c01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, a: number, b: number) => c01((t - a) / (b - a));
const ein = (x: number) => x * x;
const eout = (x: number) => 1 - (1 - x) * (1 - x);

export type Captions = { intro: number; watch: number; highway: number; collide: number; undo: number; empty: number };

export function captions(k: number, home: boolean): Captions {
  if (home) return { intro: 0, watch: 0, highway: 0, collide: 0, undo: 0, empty: 1 };
  const t = timeOf(k);
  const watch = Math.max(
    eout(seg(t, 5.9, 6.4)) * (1 - ein(seg(t, T_HW0 - 0.5, T_HW0 - 0.25))),
    eout(seg(t, T_HW1 + 0.55, T_HW1 + 0.85)) * (1 - ein(seg(t, T_COL - 0.9, T_COL - 0.5))),
  );
  return {
    intro: 1 - ein(seg(t, 5.4, 6.0)),
    watch,
    highway: eout(seg(t, T_HW0 - 0.25, T_HW0 + 0.05)) * (1 - ein(seg(t, T_HW1 + 0.3, T_HW1 + 0.55))),
    collide: eout(seg(t, T_COL - 0.45, T_COL - 0.15)) * (1 - ein(seg(t, T_COL + 0.55, T_COL + 0.8))),
    undo: eout(seg(t, T_COL + 0.75, T_COL + 1.05)) * (1 - ein(seg(t, T_LAST - 2.2, T_LAST - 1.8))),
    empty: eout(seg(t, T_END - 0.15, T_END + 0.15)),
  };
}
