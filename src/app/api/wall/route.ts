import { connection } from "next/server";
import { getAdminSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { FOUNDER_SLOTS } from "@/lib/tiers";

const shortName = (n: string | null) => {
  const parts = (n ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Supporter";
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
};

export async function GET() {
  await connection();
  const headers = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
  if (!supabaseConfigured()) return Response.json({ supporters: [], foundersTaken: 0, founderSlots: FOUNDER_SLOTS }, { headers });
  const sb = getAdminSupabase();
  const now = new Date().toISOString();
  const [{ data }, { count }] = await Promise.all([
    sb
      .from("profiles")
      .select("name, wall_name, supporter_months, founder_no")
      .eq("show_on_wall", true)
      .gt("supporter_until", now)
      .order("supporter_months", { ascending: false })
      .limit(300),
    sb.from("profiles").select("id", { count: "exact", head: true }).not("founder_no", "is", null),
  ]);
  const supporters = (data ?? []).map((p) => ({
    name: (p.wall_name as string | null)?.trim() || shortName(p.name as string | null),
    months: p.supporter_months as number,
    founderNo: p.founder_no as number | null,
  }));
  return Response.json({ supporters, foundersTaken: count ?? 0, founderSlots: FOUNDER_SLOTS }, { headers });
}
