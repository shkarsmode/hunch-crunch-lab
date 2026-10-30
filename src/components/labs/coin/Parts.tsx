import { EXTRA, SEMI, V, u } from "./scene";

export function ChartSkeleton() {
  const heights = Array.from({ length: 24 }, (_, i) => Math.exp(-Math.pow((i - 11.5) / 3.6, 2) / 2));
  const bw = 810 / heights.length;
  return (
    <div aria-hidden>
      <div className="flex justify-around" style={{ width: u(870), marginLeft: "auto", marginRight: "auto", paddingBottom: u(26), opacity: 0.45 }}>
        <div className="text-center">
          <div style={{ ...SEMI, fontSize: u(28), lineHeight: 1.2, color: V.muted }}>REAL COINS</div>
          <div className="num" style={{ ...EXTRA, fontSize: u(64), lineHeight: 1.15, color: V.white }}>
            0
          </div>
        </div>
        <div className="text-center">
          <div style={{ ...SEMI, fontSize: u(28), lineHeight: 1.2, color: V.muted }}>MOST SWITCHES</div>
          <div className="num" style={{ ...EXTRA, fontSize: u(64), lineHeight: 1.15, color: V.mint }}>
            0
          </div>
        </div>
      </div>
      <div className="relative" style={{ width: u(870), aspectRatio: "870 / 570", marginLeft: "auto", marginRight: "auto", borderRadius: u(22), background: "rgb(12 20 48 / 0.9)" }}>
        <svg viewBox="0 0 870 570" className="absolute inset-0 block h-full w-full">
          <g className="animate-pulse">
            {heights.map((h, i) => (
              <rect key={i} x={30 + i * bw + 1} y={460 - h * 300} width={bw - 2} height={h * 300} fill={V.slate} fillOpacity={0.2} />
            ))}
          </g>
          <line x1={30} x2={840} y1={460} y2={460} stroke={V.axis} strokeWidth={3} />
        </svg>
      </div>
    </div>
  );
}

type IconProps = { className?: string };

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export function TuneIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h8M18 7h2M4 17h2M12 17h8" />
      <circle cx="15" cy="7" r="2.4" />
      <circle cx="9" cy="17" r="2.4" />
    </svg>
  );
}

export function UndoIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h9a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

export function ResetIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export function CheckIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CopyIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="9" y="9" width="11" height="11" rx="3" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

export function CoinIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.5 10c0-1.1 1.1-1.8 2.5-1.8s2.5.7 2.5 1.8-1.1 1.6-2.5 1.8-2.5.7-2.5 1.8 1.1 1.8 2.5 1.8 2.5-.7 2.5-1.8" strokeWidth="1.6" />
    </svg>
  );
}

export function RepeatIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M17 3l4 4-4 4" />
      <path d="M3 11V9a2 2 0 0 1 2-2h16" />
      <path d="M7 21l-4-4 4-4" />
      <path d="M21 13v2a2 2 0 0 1-2 2H3" />
    </svg>
  );
}
