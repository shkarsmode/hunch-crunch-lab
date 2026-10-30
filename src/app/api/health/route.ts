import { connection } from "next/server";
import { authReachable, getAdminSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { fail, ipOf } from "@/lib/http";
import { allow } from "@/lib/rate-limit";

// A daily Vercel cron (vercel.json) calls this: a few real queries keep the free
// Supabase project from pausing, and the answer shows both keys still work.
export async function GET(request: Request) {
  await connection();
  if (!allow(`health:${ipOf(request)}`, 10, 60_000)) return fail(429, "slow down");
  const headers = { "Cache-Control": "public, s-maxage=60" };
  if (!supabaseConfigured()) return Response.json({ ok: false, db: false, auth: false }, { status: 503, headers });
  const sb = getAdminSupabase();
  const [flags, profiles, ideas, auth] = await Promise.all([
    sb.from("flags").select("key").limit(1),
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("ideas").select("id", { count: "exact", head: true }),
    authReachable(),
  ]);
  const db = !flags.error && !profiles.error && !ideas.error;
  return Response.json({ ok: db && auth, db, auth }, { status: db && auth ? 200 : 503, headers });
}
