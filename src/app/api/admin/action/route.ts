import { getAdminSupabase } from "@/lib/supabase/server";
import { dropFlagCache, requireAdmin } from "@/lib/me";
import { DEFAULT_FLAGS } from "@/lib/flags";
import { NO_STORE, cleanText, fail, ipOf, isUuid, readJson, sameOrigin } from "@/lib/http";
import { allow } from "@/lib/rate-limit";

type Action =
  | { type: "flag"; key: string; enabled: boolean }
  | { type: "role"; userId: string; role: "user" | "admin" }
  | { type: "comp"; userId: string; days: number }
  | { type: "idea"; id: string; status?: string; video?: string | null; hidden?: boolean; title?: string };

const STATUSES = new Set(["heard", "crunching", "rendering", "live"]);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, "forbidden");
  if (!allow(`act:${ipOf(request)}`, 60, 60_000)) return fail(429, "slow down");
  const admin = await requireAdmin();
  if (!admin) return fail(403, "admins only");
  const a = await readJson<Action>(request, 2048);
  if (!a) return fail(400, "bad request");
  const sb = getAdminSupabase();

  if (a.type === "flag") {
    if (!(a.key in DEFAULT_FLAGS) || typeof a.enabled !== "boolean") return fail(400, "bad flag");
    await sb.from("flags").upsert({ key: a.key, enabled: a.enabled, updated_at: new Date().toISOString() });
    dropFlagCache();
  } else if (a.type === "role") {
    if (!isUuid(a.userId) || (a.role !== "user" && a.role !== "admin")) return fail(400, "bad role");
    if (a.userId === admin.id && a.role !== "admin") return fail(400, "you can't remove your own admin");
    await sb.from("profiles").update({ role: a.role }).eq("id", a.userId);
  } else if (a.type === "comp") {
    const days = Math.floor(Number(a.days));
    if (!isUuid(a.userId) || !Number.isFinite(days) || days < 0 || days > 3650) return fail(400, "bad comp");
    const until = new Date(Date.now() + days * 86_400_000).toISOString();
    await sb.from("profiles").update({ supporter_until: until, supporter_comp: days > 0 }).eq("id", a.userId);
  } else if (a.type === "idea") {
    if (!isUuid(a.id)) return fail(400, "bad idea");
    const patch: Record<string, unknown> = {};
    if (a.status !== undefined) {
      if (!STATUSES.has(a.status)) return fail(400, "bad status");
      patch.status = a.status;
    }
    if (a.video !== undefined) {
      if (a.video !== null && !/^[A-Za-z0-9_-]{11}$/.test(a.video)) return fail(400, "bad video id");
      patch.video_id = a.video;
    }
    if (typeof a.hidden === "boolean") patch.hidden = a.hidden;
    if (a.title !== undefined) {
      const t = cleanText(a.title, 120);
      if (t.length < 6) return fail(400, "title too short");
      patch.title = t;
    }
    if (!Object.keys(patch).length) return fail(400, "nothing to change");
    await sb.from("ideas").update(patch).eq("id", a.id);
  } else {
    return fail(400, "unknown action");
  }
  return Response.json({ ok: true }, { headers: NO_STORE });
}
