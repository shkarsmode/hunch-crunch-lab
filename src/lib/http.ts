import "server-only";
import { timingSafeEqual } from "node:crypto";

export const NO_STORE = { "Cache-Control": "no-store" };

export function ipOf(req: Request) {
  const h = req.headers;
  return (h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0] || "local").trim().slice(0, 64);
}

export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

export async function readJson<T>(req: Request, max = 4096): Promise<T | null> {
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return null;
  if (Number(req.headers.get("content-length") ?? 0) > max) return null;
  const text = await req.text();
  if (text.length > max) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? (v as T) : null;
  } catch {
    return null;
  }
}

export function fail(status: number, error: string) {
  return Response.json({ error }, { status, headers: NO_STORE });
}

export function safeNext(next: string | null, origin: string) {
  if (!next) return "/";
  try {
    const u = new URL(next, origin);
    return u.origin === origin ? u.pathname + u.search : "/";
  } catch {
    return "/";
  }
}

export function equalSecret(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function cleanText(v: unknown, max: number) {
  if (typeof v !== "string") return "";
  return v
    .replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
