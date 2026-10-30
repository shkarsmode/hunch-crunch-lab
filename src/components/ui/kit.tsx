import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* The Instrument kit: hairline panels, mono labels, one gold accent. */

export const PANEL = "rounded-2xl border border-hair bg-navy-850";

type Variant = "primary" | "ghost" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";

const BASE =
  "group inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";
const VARIANT: Record<Variant, string> = {
  primary: "bg-gold text-[#0B0D12] shadow-[0_0_0_1px_rgb(255_201_74/0.45),0_12px_32px_-12px_rgb(255_201_74/0.55)] hover:bg-gold-hi",
  ghost: "border border-hair-strong text-ink/85 hover:border-white/30 hover:text-ink",
  quiet: "text-ink/70 hover:bg-white/[0.04] hover:text-ink",
  danger: "border border-coral/30 text-coral hover:border-coral/60 hover:bg-coral/[0.06]",
};
const SIZE: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-4 text-[14px]",
  lg: "h-[52px] px-5 text-[15px]",
};

// `extra` is for layout (width, margin, flex). Never repeat a property the variant or size sets:
// Tailwind decides by stylesheet order, not class order, so the override can silently lose.
export const btn = (variant: Variant = "primary", size: Size = "md", extra = "") => `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${extra}`;

export function ButtonLink({ variant, size, className = "", ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={btn(variant, size, className)} {...rest} />;
}

export function SectionLabel({ n, title, right, className = "" }: { n?: string; title: string; right?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between font-mono text-[11px] tracking-[0.08em] text-ink/45 ${className}`}>
      <span>
        {n && <span className="mr-2.5 text-ink/25">{n}</span>}
        {title.toUpperCase()}
      </span>
      {right && <span className="text-ink/30">{right}</span>}
    </div>
  );
}

export function Readout({ label, value, tone = "text-ink", className = "" }: { label: string; value: ReactNode; tone?: string; className?: string }) {
  return (
    <div className={`rounded-md border border-white/10 bg-black/75 px-2 py-1 font-mono leading-tight ${className}`}>
      <div className="text-[9px] tracking-[0.12em] text-ink/45">{label}</div>
      <div className={`text-[13px] tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

const TAG = {
  free: "text-mint",
  full: "text-gold",
  dim: "text-ink/35",
  live: "text-ant-a",
  warn: "text-coral",
} as const;

export function Tag({ tone = "dim", children, className = "" }: { tone?: keyof typeof TAG; children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[10px] tracking-[0.08em] uppercase ${TAG[tone]} ${className}`}>{children}</span>;
}

export function LiveDot({ className = "text-ant-a" }: { className?: string }) {
  return <span className={`live-dot inline-block ${className}`} />;
}
