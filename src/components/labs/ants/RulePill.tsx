import { forwardRef } from "react";

const u = (n: number) => `calc(var(--sw) * ${n} / 1080)`;

export function TurnIcon({ cw }: { cw: boolean }) {
  return (
    <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ width: u(72), height: u(72) }} aria-hidden>
      <g transform={cw ? undefined : "scale(-1 1)"}>
        <path d="M -0.45 0.95 L -0.45 -0.05 Q -0.45 -0.55 0.15 -0.55 L 0.45 -0.55" fill="none" stroke="#FFD166" strokeWidth="0.24" strokeLinecap="round" />
        <path d="M 1 -0.55 L 0.38 -0.97 L 0.38 -0.13 Z" fill="#FFD166" />
      </g>
    </svg>
  );
}

const RulePill = forwardRef<HTMLDivElement, { lit: boolean; cw: boolean; label: string }>(function RulePill({ lit, cw, label }, ref) {
  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className="relative flex items-center justify-center"
      style={{ width: u(300), height: u(120), borderRadius: u(30), background: "rgba(255,255,255,0.06)" }}
    >
      <span
        className="absolute"
        style={{
          left: `calc(50% - ${u(62)} - ${u(32)})`,
          width: u(64),
          height: u(64),
          borderRadius: u(12),
          background: lit ? "#E8ECF6" : "#141A31",
          boxShadow: `inset 0 0 0 ${u(3)} rgba(141,154,184,0.85)`,
        }}
      />
      <span className="absolute font-semibold" style={{ left: `calc(50% + ${u(2)} - 0.5em)`, fontSize: u(46), color: "#8D9AB8", lineHeight: 1 }}>
        →
      </span>
      <span className="absolute" style={{ left: `calc(50% + ${u(82)} - ${u(36)})`, top: `calc(50% - ${u(36)})` }}>
        <TurnIcon cw={cw} />
      </span>
    </div>
  );
});

export default RulePill;
