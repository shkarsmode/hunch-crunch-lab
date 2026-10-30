import { connection } from "next/server";
import { getAdminSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { isActive, loadFlags, requireUser } from "@/lib/me";
import { NO_STORE, cleanText, fail, ipOf, readJson, sameOrigin } from "@/lib/http";
import { allow } from "@/lib/rate-limit";

export async function GET() {
  await connection();
  const headers = { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" };
  if (!supabaseConfigured()) return Response.json({ ideas: [] }, { headers });
  const { data } = await getAdminSupabase()
    .from("ideas")
    .select("id, title, by_name, status, video_id, created_at")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(200);
  const ideas = (data ?? []).map((i) => ({ id: i.id, title: i.title, by: i.by_name, status: i.status, video: i.video_id ?? undefined }));
  return Response.json({ ideas }, { headers });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, "forbidden");
  if (!allow(`idea:${ipOf(request)}`, 5, 60_000)) return fail(429, "slow down");
  const profile = await requireUser();
  if (!profile) return fail(401, "sign in first");
  if (!(await loadFlags())["ideas.submit"]) return fail(403, "ideas are closed right now");
  if (profile.role !== "admin" && !isActive(profile)) return fail(403, "supporters only");
  const body = await readJson<{ title?: unknown; details?: unknown }>(request, 2048);
  const title = cleanText(body?.title, 120);
  const details = cleanText(body?.details, 600);
  if (title.length < 6) return fail(400, "a few more words, please");
  const sb = getAdminSupabase();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await sb.from("ideas").select("id", { count: "exact", head: true }).eq("user_id", profile.id).gte("created_at", since);
  if ((count ?? 0) >= 3) return fail(429, "three ideas a day, max");
  const by = cleanText(profile.wall_name || profile.name || "Supporter", 60);
  const { error } = await sb.from("ideas").insert({ user_id: profile.id, title, details: details || null, by_name: by });
  if (error) return fail(500, "could not save");
  return Response.json({ ok: true }, { headers: NO_STORE });
}
