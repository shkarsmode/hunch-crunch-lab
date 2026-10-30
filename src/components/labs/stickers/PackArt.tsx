"use client";

import { useId } from "react";

function zigzag(from: number, to: number, y: number, amp: number, teeth: number) {
  let d = "";
  for (let i = 0; i <= teeth; i++) {
    const x = from + ((to - from) * i) / teeth;
    d += `L${x.toFixed(1)} ${(y + (i % 2 ? amp : 0)).toFixed(1)} `;
  }
  return d;
}

const bodyPath = `M10 30 L110 30 ${zigzag(110, 10, 158, 6, 20)}Z`;
const topPath = `M10 33 ${zigzag(10, 110, 14, -6, 20)}L110 33 Z`;

const bottom = { transformBox: "fill-box", transformOrigin: "50% 100%" } as const;
const middle = { transformBox: "fill-box", transformOrigin: "50% 50%" } as const;

export default function PackArt({ k, className }: { k: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 170" className={className} style={{ overflow: "visible" }} aria-hidden>
      <defs>
        <linearGradient id={`foil-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="0.45" stopColor="#FFC94A" />
          <stop offset="1" stopColor="#C98F22" />
        </linearGradient>
        <linearGradient id={`strip-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD45E" />
          <stop offset="1" stopColor="#E9B949" />
        </linearGradient>
        <radialGradient id={`glow-${id}`}>
          <stop offset="0" stopColor="#FFF6D6" stopOpacity="1" />
          <stop offset="0.4" stopColor="#FFC94A" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FFC94A" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`clip-${id}`}>
          <path d={bodyPath} />
        </clipPath>
      </defs>
      <g data-part="glow" style={{ ...middle, opacity: 0 }}>
        <circle cx="60" cy="26" r="70" fill={`url(#glow-${id})`} />
      </g>
      <g data-part="body" style={bottom}>
        <path d={bodyPath} fill={`url(#foil-${id})`} stroke="#8A5E10" strokeWidth="1.5" strokeLinejoin="round" />
        <g clipPath={`url(#clip-${id})`}>
          <path d="M-10 190 L60 20 L82 20 L12 190 Z" fill="#FFFFFF" opacity="0.2" />
          <path d="M70 190 L125 40 L135 40 L80 190 Z" fill="#FFFFFF" opacity="0.14" />
        </g>
        <rect x="24" y="52" width="72" height="84" rx="16" fill="#0B1020" opacity="0.92" />
        <rect x="24" y="52" width="72" height="84" rx="16" fill="none" stroke="#FFC94A" strokeOpacity="0.55" strokeWidth="1.5" />
        <text x="60" y="72" textAnchor="middle" fontSize="7" fontWeight="800" letterSpacing="0.9" fill="#FFC94A">
          HUNCH CRUNCH
        </text>
        <text x="60" y="114" textAnchor="middle" fontSize="46" fontWeight="900" fill="#FFC94A">
          {k}
        </text>
        <text x="60" y="128" textAnchor="middle" fontSize="7.5" fontWeight="800" letterSpacing="1.2" fill="#A9B6D3">
          STICKERS
        </text>
      </g>
      <g data-part="top" style={bottom}>
        <path d={topPath} fill={`url(#strip-${id})`} stroke="#8A5E10" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M16 27 L104 27" stroke="#FFF3C4" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
