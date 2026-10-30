import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {children}
    </svg>
  );
}

export const Icon = {
  Play: (p: IconProps) => (
    <Svg {...p}>
      <path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.2-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6Z" fill="currentColor" stroke="none" />
    </Svg>
  ),
  Pause: (p: IconProps) => (
    <Svg {...p}>
      <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none" />
    </Svg>
  ),
  Step: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6 6.5v11l8-5.5-8-5.5Z" fill="currentColor" stroke="none" />
      <path d="M17.5 6v12" />
    </Svg>
  ),
  Reset: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4" />
      <path d="M4.5 4.5v4h4" />
    </Svg>
  ),
  Lock: (p: IconProps) => (
    <Svg {...p}>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.4" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Svg>
  ),
  Chevron: (p: IconProps) => (
    <Svg {...p}>
      <path d="m9.5 6 6 6-6 6" />
    </Svg>
  ),
  Arrow: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  ),
  Out: (p: IconProps) => (
    <Svg {...p}>
      <path d="M8 16 16.5 7.5M9.5 7.5h7v7" />
    </Svg>
  ),
  Check: (p: IconProps) => (
    <Svg {...p}>
      <path d="m5.5 12.5 4 4 9-9.5" />
    </Svg>
  ),
  Plus: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Svg>
  ),
  Minus: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5.5 12h13" />
    </Svg>
  ),
  Sound: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z" fill="currentColor" stroke="none" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" />
    </Svg>
  ),
  Mute: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z" fill="currentColor" stroke="none" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </Svg>
  ),
  Sliders: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" />
      <circle cx="15" cy="7.5" r="2.2" />
      <circle cx="9" cy="16.5" r="2.2" />
    </Svg>
  ),
  Target: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </Svg>
  ),
  Share: (p: IconProps) => (
    <Svg {...p}>
      <path d="M9.5 14.5 14.5 9.5M10 7.5l1.6-1.6a3.5 3.5 0 0 1 5 5L15 12.5M14 16.5l-1.6 1.6a3.5 3.5 0 0 1-5-5L9 11.5" />
    </Svg>
  ),
  Close: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Svg>
  ),
  Menu: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4.5 8.5h15M4.5 15.5h15" />
    </Svg>
  ),
  Spark: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 3.5c.6 4.3 2.4 6.3 6.5 7-4.1.8-5.9 2.8-6.5 7-.6-4.2-2.4-6.2-6.5-7 4.1-.7 5.9-2.7 6.5-7Z" fill="currentColor" stroke="none" />
    </Svg>
  ),
  Youtube: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="6" width="18" height="12.5" rx="4" />
      <path d="m10.5 9.7 4.3 2.55-4.3 2.55Z" fill="currentColor" stroke="none" />
    </Svg>
  ),
};
