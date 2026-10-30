import { getAdminSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/me";
import { NO_STORE, cleanText, fail, ipOf, readJson, sameOrigin } from "@/lib/http";
import { allow } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, "forbidden");
  if (!allow(`profile:${ipOf(request)}`, 20, 60_000)) return fail(429, "slow down");
  const profile = await requireUser();
  if (!profile) return fail(401, "sign in first");
  const body = await readJson<{ showOnWall?: unknown; wallName?: unknown }>(request, 1024);
  if (!body) return fail(400, "bad request");
  const patch: Record<string, unknown> = {};
  if (typeof body.showOnWall === "boolean") patch.show_on_wall = body.showOnWall;
  if (body.wallName !== undefined) patch.wall_name = cleanText(body.wallName, 40) || null;
  if (!Object.keys(patch).length) return fail(400, "nothing to change");
  await getAdminSupabase().from("profiles").update(patch).eq("id", profile.id);
  return Response.json({ ok: true }, { headers: NO_STORE });
}
