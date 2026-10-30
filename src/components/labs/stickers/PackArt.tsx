"use client";

import { useId } from "react";
import { DISPLAY, PACK } from "./video";

export default function PackArt({ k }: { k: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg width={PACK.w} height={PACK.h} viewBox={`0 0 ${PACK.w} ${PACK.h}`} style={{ overflow: "visible", display: "block" }} aria-hidden>
      <defs>
        <linearGradient id={`pg${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={PACK.w} y2={PACK.h}>
          <stop offset="0" stopColor="#FFE08A" />
          <stop offset="0.5" stopColor="#C98F22" />
          <stop offset="1" stopColor="#FFD45E" />
        </linearGradient>
      </defs>
      <g data-part="body" style={{ transformBox: "view-box", transformOrigin: `0px ${PACK.h}px` }}>
        <rect width={PACK.w} height={PACK.h} rx="14" fill={`url(#pg${id})`} />
      </g>
      <g data-part="flap" style={{ transformBox: "view-box", transformOrigin: `${PACK.w / 2}px 0px` }}>
        <rect width={PACK.w} height="22" rx="8" fill="#E9B949" />
      </g>
      <path d={`M12 34H${PACK.w - 12}`} stroke="#FFF3C4" strokeOpacity="0.6" strokeWidth="3" fill="none" />
      <text x={PACK.w / 2} y={PACK.h / 2 + 22} textAnchor="middle" fontSize="64" fill="#5A3B00" style={DISPLAY}>
        {k}
      </text>
    </svg>
  );
}
