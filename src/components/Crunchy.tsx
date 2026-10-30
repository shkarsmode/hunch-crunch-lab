"use client";

import { useId } from "react";

export type CrunchyMood = "smirk" | "wow" | "grin" | "squint" | "frown";

type Props = {
  size?: number;
  mood?: CrunchyMood;
  bite?: boolean;
  look?: { x: number; y: number };
  blink?: boolean;
  shadow?: boolean;
  className?: string;
  title?: string;
};

const NAVY = "#0B1020";

export default function Crunchy({
  size = 96,
  mood = "smirk",
  bite = true,
  look = { x: 0, y: 0 },
  blink = true,
  shadow = true,
  className,
  title = "Crunchy",
}: Props) {
  const id = useId().replace(/:/g, "");
  const lx = look.x * 0.12;
  const ly = look.y * 0.1;
  const squint = mood === "squint" ? 1 : 0;
  const wow = mood === "wow" ? 1 : 0;
  const er = 0.2 * (1 + 0.28 * wow);
  const eyes = [-1, 1].map((side) => {
    const ex = side * 0.42 + lx;
    const ey = -0.06 + ly;
    const close = side < 0 ? 0 : 0.62 * squint;
    const ry = er * (1 - 0.85 * close);
    return { side, ex, ey, ry };
  });
  return (
    <svg
      viewBox="-1.25 -1.25 2.5 2.62"
      width={size}
      height={size * 1.048}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <mask id={`bite-${id}`}>
          <rect x="-2" y="-2" width="4" height="4" fill="white" />
          {bite && (
            <>
              <circle cx="0.98" cy="-0.58" r="0.37" fill="black" />
              <circle cx="0.58" cy="-0.98" r="0.37" fill="black" />
            </>
          )}
        </mask>
        <filter id={`soft-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.06" />
        </filter>
      </defs>
      {shadow && <ellipse cx="0" cy="1.19" rx="0.9" ry="0.15" fill="#000" opacity="0.45" filter={`url(#soft-${id})`} />}
      <g mask={`url(#bite-${id})`}>
        <rect x="-1" y="-0.88" width="2" height="2" rx="0.46" fill="#C98F22" />
        <rect x="-1" y="-1" width="2" height="2" rx="0.46" fill="#FFC94A" />
        {eyes.map(({ side, ex, ey, ry }) => (
          <g key={side} className={blink ? "animate-blink" : undefined} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <ellipse cx={ex} cy={ey} rx={er} ry={ry} fill={NAVY} />
            {ry > er * 0.45 && <circle cx={ex + er * 0.32} cy={ey - ry * 0.38} r={er * 0.27} fill="#F4F6FB" opacity="0.95" />}
          </g>
        ))}
        {squint > 0 && (
          <path
            d={`M ${-0.64 + lx} ${-0.44 + ly} L ${-0.22 + lx} ${-0.56 + ly}`}
            stroke={NAVY}
            strokeWidth="0.085"
            strokeLinecap="round"
          />
        )}
        {mood === "wow" && <ellipse cx="0" cy="0.43" rx="0.1" ry="0.13" fill={NAVY} />}
        {mood === "grin" && <path d="M -0.32 0.33 Q 0 0.66 0.32 0.33 Z" fill={NAVY} />}
        {mood === "frown" && <path d="M -0.24 0.52 Q 0 0.34 0.24 0.52" stroke={NAVY} strokeWidth="0.09" strokeLinecap="round" fill="none" />}
        {(mood === "smirk" || mood === "squint") && (
          <path d="M -0.22 0.4 Q 0.02 0.54 0.26 0.33" stroke={NAVY} strokeWidth="0.09" strokeLinecap="round" fill="none" />
        )}
      </g>
    </svg>
  );
}
