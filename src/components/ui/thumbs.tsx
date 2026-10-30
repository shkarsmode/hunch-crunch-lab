/* A small real Langton pattern: two RL ants taking turns, like the video. */
type Cell = { x: number; y: number; o: number };
const PATTERN: Cell[] = (() => {
  const N = 26;
  const grid = new Map<number, number>();
  const ants = [
    { x: 13, y: 15, d: 0 },
    { x: 8, y: 11, d: 1 },
  ];
  const D = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  for (let k = 0; k < 900; k++) {
    const a = ants[k % 2];
    const key = a.y * N + a.x;
    const on = grid.has(key);
    a.d = (a.d + (on ? 3 : 1)) % 4;
    if (on) grid.delete(key);
    else grid.set(key, k % 2);
    a.x = (a.x + D[a.d][0] + N) % N;
    a.y = (a.y + D[a.d][1] + N) % N;
  }
  return [...grid.entries()].map(([key, o]) => ({ x: key % N, y: Math.floor(key / N), o }));
})();

const BOX = (() => {
  const xs = PATTERN.map((c) => c.x);
  const ys = PATTERN.map((c) => c.y);
  const x0 = Math.min(...xs) - 1;
  const y0 = Math.min(...ys) - 1;
  const side = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0) + 2;
  return { x0, y0, side };
})();

export function AntsThumb({ className = "", cell = 2.6, colors = ["#3FD2FF", "#FF4FD8"] }: { className?: string; cell?: number; colors?: [string, string] | string[] }) {
  const { x0, y0, side } = BOX;
  return (
    <svg viewBox={`${x0 * cell} ${y0 * cell} ${side * cell} ${side * cell}`} className={className} aria-hidden>
      {PATTERN.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x * cell + 0.25} y={c.y * cell + 0.25} width={cell - 0.5} height={cell - 0.5} rx={cell * 0.22} fill={colors[c.o]} opacity={0.92} />
      ))}
    </svg>
  );
}

export function CoinThumb({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`coin3d ${className}`} style={{ width: size, height: size }} aria-hidden>
      <div className="coin3d-spin">
        <div className="coin3d-face coin3d-h" style={{ fontSize: size * 0.42 }}>
          H
        </div>
        <div className="coin3d-face coin3d-t" style={{ fontSize: size * 0.42 }}>
          T
        </div>
      </div>
    </div>
  );
}

const STICKERS = [
  { n: 17, c: "#FF5C7A" },
  { n: 42, c: "#3FE0FF" },
  { n: 3, c: "#FFC94A" },
];

export function PackThumb({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }} aria-hidden>
      {STICKERS.map((s, i) => (
        <div
          key={s.n}
          className="sticker-card absolute inset-[14%] grid place-items-center rounded-[22%] font-black text-[#0B1020]"
          style={{
            background: `linear-gradient(160deg, #ffffff 0%, ${s.c} 75%)`,
            transform: `rotate(${(i - 1) * 14}deg) translateX(${(i - 1) * 9}%)`,
            fontSize: size * 0.22,
            animationDelay: `${i * 0.25}s`,
            zIndex: i === 1 ? 2 : 1,
            boxShadow: "0 6px 14px -6px rgba(0,0,0,.6)",
          }}
        >
          #{s.n}
        </div>
      ))}
    </div>
  );
}
