import { getAdminSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { ipOf, readJson, sameOrigin } from "@/lib/http";
import { allow } from "@/lib/rate-limit";

const PATHS = new Set(["/", "/lab/two-ants", "/lab/coin", "/lab/stickers", "/support", "/ideas", "/privacy", "/terms"]);

function source(ref: string) {
  let host = "";
  try {
    host = ref ? new URL(ref).hostname.replace(/^www\./, "") : "";
  } catch {}
  if (!host) return "direct";
  // Landing back from Google sign-in is not a new visitor source.
  if (/^accounts\.google\.|(^|\.)supabase\.co$/.test(host)) return "direct";
  if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(host)) return "youtube";
  if (/(^|\.)(google|bing|duckduckgo|yahoo|yandex|ecosia)\./.test(host)) return "search";
  if (/(^|\.)(t\.co|twitter\.com|x\.com|reddit\.com|facebook\.com|instagram\.com|tiktok\.com|t\.me|discord\.com|linkedin\.com)$/.test(host)) return "social";
  return "other";
}

export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  if (!supabaseConfigured() || !sameOrigin(request)) return done;
  if (!allow(`visit:${ipOf(request)}`, 30, 60_000)) return done;
  const body = await readJson<{ path?: unknown; ref?: unknown; w?: unknown }>(request, 1024);
  if (!body) return done;
  const raw = typeof body.path === "string" ? body.path.split("?")[0] : "";
  const path = PATHS.has(raw) ? raw : "other";
  const cc = (request.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  const country = /^[A-Z]{2}$/.test(cc) ? cc : "??";
  const device = typeof body.w === "number" && body.w < 768 ? "phone" : "desktop";
  const day = new Date().toISOString().slice(0, 10);
  await getAdminSupabase().rpc("bump_visit", {
    p_day: day,
    p_path: path,
    p_country: country,
    p_device: device,
    p_source: source(typeof body.ref === "string" ? body.ref.slice(0, 300) : ""),
  });
  return done;
}
