import type { ReactNode } from "react";
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

/* The docked control bar: a full-bleed hairline panel stuck to the bottom of the scroll, content kept to max-w-md. */
export function Dock({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sticky bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 border-t border-hair bg-navy-900" />
      <div className="relative mx-auto max-w-md">{children}</div>
    </div>
  );
}

type IconProps = { size?: number; className?: string };

function Svg({ size = 20, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {children}
    </svg>
  );
}

export function UndoIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 13.5 4.5 9 9 4.5" />
      <path d="M4.5 9h9.25a5.25 5.25 0 0 1 0 10.5H10" />
    </Svg>
  );
}

export function CoinIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.75 8.5v7M14.25 8.5v7M9.75 12h4.5" />
    </Svg>
  );
}
