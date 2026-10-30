import { COINS } from "./engine";
import type { Side } from "./engine";

export const SCAN_MS = 800;
export const RAMP_DELAY = 300;
export const RAMP_MS = 1200;
export const BEAT_MS = 450;

export function rampShown(t: number): number {
  const u = Math.min(1, Math.max(0, (t - RAMP_DELAY) / RAMP_MS));
  if (u >= 1) return COINS;
  return Math.floor(COINS * Math.pow(u, 1.7));
}

export const GOLD_FACE = "radial-gradient(circle at 34% 26%, #fff3c0 0%, #ffd870 24%, #ffc94a 52%, #e0a532 80%, #c98f22 100%)";
export const CYAN_FACE = "radial-gradient(circle at 34% 26%, #e6fbff 0%, #8aeeff 26%, #3fe0ff 54%, #22b5d6 82%, #1a8fae 100%)";

export function faceOf(side: Side): string {
  return side === "H" ? GOLD_FACE : CYAN_FACE;
}

export function haptic(): void {
  try {
    navigator.vibrate?.(8);
  } catch {}
}

export function reducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function toss(from: DOMRect, to: DOMRect, side: Side): void {
  if (reducedMotion()) return;
  const el = document.createElement("div");
  if (typeof el.animate !== "function") return;
  const d = Math.max(to.width, 8);
  const fx = from.left + from.width / 2;
  const fy = from.top + from.height / 2;
  const dx = to.left + to.width / 2 - fx;
  const dy = to.top + to.height / 2 - fy;
  const k = Math.max(from.width / d, 1) * 0.8;
  const lift = Math.min(110, Math.abs(dy) * 0.28 + 34);
  Object.assign(el.style, {
    position: "fixed",
    left: `${fx - d / 2}px`,
    top: `${fy - d / 2}px`,
    width: `${d}px`,
    height: `${d}px`,
    borderRadius: "50%",
    background: faceOf(side),
    boxShadow: "0 3px 8px rgb(0 0 0 / 0.45)",
    display: "grid",
    placeItems: "center",
    color: "#0B1020",
    fontWeight: "900",
    fontSize: `${d * 0.56}px`,
    lineHeight: "1",
    pointerEvents: "none",
    zIndex: "70",
    willChange: "transform, opacity",
  });
  el.textContent = side;
  document.body.appendChild(el);
  const anim = el.animate(
    [
      { transform: `translate(0px, 0px) scale(${k})`, opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - lift}px) scale(${k * 0.36 + 0.5})`, opacity: 1, offset: 0.48 },
      { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1, offset: 0.84 },
      { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 0, offset: 1 },
    ],
    { duration: 330, easing: "cubic-bezier(0.3, 0.7, 0.4, 1)" },
  );
  const done = () => el.remove();
  anim.onfinish = done;
  anim.oncancel = done;
}

export function spin(el: HTMLElement | null): void {
  if (!el || reducedMotion() || typeof el.animate !== "function") return;
  for (const a of el.getAnimations()) a.cancel();
  el.animate(
    [
      { transform: "translateY(0) rotateY(0deg) scale(1)", offset: 0 },
      { transform: "translateY(8px) rotateY(0deg) scale(0.97)", offset: 0.1 },
      { transform: "translateY(-26px) rotateY(180deg) scale(1.08)", offset: 0.5 },
      { transform: "translateY(0) rotateY(360deg) scale(1)", offset: 1 },
    ],
    { duration: 430, easing: "cubic-bezier(0.3, 0.6, 0.35, 1)" },
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      const settled = await Promise.race([
        navigator.clipboard.writeText(text).then(
          () => true,
          () => false,
        ),
        new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 1500)),
      ]);
      if (settled) return true;
    }
  } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    Object.assign(ta.style, { position: "fixed", top: "0", left: "0", opacity: "0", pointerEvents: "none" });
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
