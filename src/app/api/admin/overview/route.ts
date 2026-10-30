import { getAdminSupabase } from "@/lib/supabase/server";
import { loadFlags, requireAdmin } from "@/lib/me";
import { NO_STORE, fail, ipOf } from "@/lib/http";
import { allow } from "@/lib/rate-limit";

export async function GET(request: Request) {
  if (!allow(`adm:${ipOf(request)}`, 30, 60_000)) return fail(429, "slow down");
  const admin = await requireAdmin();
  if (!admin) return fail(403, "admins only");
  const sb = getAdminSupabase();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [visits, users, ideas, flags] = await Promise.all([
    sb.from("visit_daily").select("day, path, country, device, source, n").gte("day", since).limit(20000),
    sb
      .from("profiles")
      .select("id, email, name, role, supporter_until, supporter_months, supporter_comp, founder_no, last_seen_at, created_at")
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .limit(300),
    sb.from("ideas").select("id, title, details, by_name, status, video_id, hidden, created_at").order("created_at", { ascending: false }).limit(300),
    loadFlags(),
  ]);
  return Response.json({ visits: visits.data ?? [], users: users.data ?? [], ideas: ideas.data ?? [], flags, me: admin.id }, { headers: NO_STORE });
}
