import type { Tier } from "@/lib/tiers";

function Pips({ n, color }: { n: number; color: string }) {
  const at: Record<number, [number, number][]> = {
    3: [[-0.32, -0.32], [0, 0], [0.32, 0.32]],
    6: [[-0.3, -0.34], [-0.3, 0], [-0.3, 0.34], [0.3, -0.34], [0.3, 0], [0.3, 0.34]],
  };
  return (
    <>
      {at[n].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.1" fill={color} />
      ))}
    </>
  );
}

export default function TierBadge({ tier, size = 72, founder = false, className = "" }: { tier: Tier; size?: number; founder?: boolean; className?: string }) {
  const g = `tb-${tier.id}`;
  return (
    <svg viewBox="-1.2 -1.2 2.4 2.4" width={size} height={size} className={className} role="img" aria-label={`${tier.name}${founder ? ", founder" : ""}`}>
      <defs>
        <radialGradient id={`${g}-glow`}>
          <stop offset="0%" stopColor={tier.color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={tier.color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${g}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="45%" stopColor={tier.color} />
          <stop offset="100%" stopColor="#0b1020" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`${g}-holo`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF5C7A" />
          <stop offset="33%" stopColor="#FFC94A" />
          <stop offset="66%" stopColor="#3EE6A0" />
          <stop offset="100%" stopColor="#3FE0FF" />
        </linearGradient>
      </defs>
      {tier.id !== "coin" && <circle r="1.18" fill={`url(#${g}-glow)`} />}
      {tier.id === "coin" && (
        <g>
          <circle r="0.82" fill={`url(#${g}-metal)`} stroke="#F4F6FB" strokeOpacity="0.5" strokeWidth="0.06" />
          <circle r="0.62" fill="none" stroke="#0b1020" strokeOpacity="0.25" strokeWidth="0.05" />
          <text y="0.24" textAnchor="middle" fontSize="0.7" fontWeight="900" fill="#0b1020" fillOpacity="0.75">H</text>
        </g>
      )}
      {tier.id === "dice" && (
        <g transform="rotate(-12)">
          <rect x="-0.72" y="-0.62" width="1.44" height="1.44" rx="0.34" fill="#1d6f86" />
          <rect x="-0.72" y="-0.72" width="1.44" height="1.44" rx="0.34" fill={`url(#${g}-metal)`} />
          <Pips n={3} color="#0b1020" />
        </g>
      )}
      {tier.id === "streak" && (
        <g>
          <path d="M0 -0.95 L0.82 -0.47 L0.82 0.47 L0 0.95 L-0.82 0.47 L-0.82 -0.47 Z" fill={`url(#${g}-metal)`} stroke="#C9FFE9" strokeOpacity="0.7" strokeWidth="0.05" />
          <Pips n={6} color="#0b1020" />
          <path d="M-0.1 -1.05 L0.25 -0.25 L0 -0.2 L0.12 0.55" stroke="#F4F6FB" strokeWidth="0.07" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        </g>
      )}
      {tier.id === "golden" && (
        <g>
          <g transform="translate(0 0.08) scale(0.78)">
            <mask id={`${g}-bite`}>
              <rect x="-2" y="-2" width="4" height="4" fill="white" />
              <circle cx="0.98" cy="-0.58" r="0.37" fill="black" />
              <circle cx="0.58" cy="-0.98" r="0.37" fill="black" />
            </mask>
            <g mask={`url(#${g}-bite)`}>
              <rect x="-1" y="-0.88" width="2" height="2" rx="0.46" fill="#C98F22" />
              <rect x="-1" y="-1" width="2" height="2" rx="0.46" fill="#FFC94A" />
              <ellipse cx="-0.42" cy="-0.06" rx="0.2" ry="0.2" fill="#0B1020" />
              <ellipse cx="0.42" cy="-0.06" rx="0.2" ry="0.2" fill="#0B1020" />
              <circle cx="-0.36" cy="-0.14" r="0.054" fill="#fff" />
              <circle cx="0.48" cy="-0.14" r="0.054" fill="#fff" />
              <path d="M -0.32 0.33 Q 0 0.66 0.32 0.33 Z" fill="#0B1020" />
            </g>
          </g>
          <path d="M-0.55 -0.92 L-0.32 -1.12 L0 -0.92 L0.32 -1.12 L0.55 -0.92 L0.48 -0.74 L-0.48 -0.74 Z" fill="#FFF1C2" stroke="#C98F22" strokeWidth="0.04" />
          {[[-0.98, -0.5], [0.98, 0.25], [-0.85, 0.75]].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y - 0.12} L${x + 0.04} ${y - 0.04} L${x + 0.12} ${y} L${x + 0.04} ${y + 0.04} L${x} ${y + 0.12} L${x - 0.04} ${y + 0.04} L${x - 0.12} ${y} L${x - 0.04} ${y - 0.04} Z`} fill="#FFF1C2" />
          ))}
        </g>
      )}
      {tier.id === "million" && (
        <g>
          <g className="animate-spin-slow" style={{ transformOrigin: "center", transformBox: "fill-box" }}>
            <path d="M0 -1.05 L0.27 -0.37 L1 -0.32 L0.43 0.14 L0.62 0.86 L0 0.46 L-0.62 0.86 L-0.43 0.14 L-1 -0.32 L-0.27 -0.37 Z" fill={`url(#${g}-holo)`} opacity="0.95" />
          </g>
          <circle r="0.36" fill="#0b1020" />
          <text y="0.12" textAnchor="middle" fontSize="0.3" fontWeight="900" fill="#F4F6FB">1:1M</text>
        </g>
      )}
      {founder && <circle r="1.1" fill="none" stroke="#FFC94A" strokeWidth="0.06" strokeDasharray="0.14 0.1" />}
    </svg>
  );
}
