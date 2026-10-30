import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { ipOf, safeNext } from "@/lib/http";
import { allow } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"), url.origin);
  const code = url.searchParams.get("code");
  if (code && supabaseConfigured() && allow(`cb:${ipOf(request)}`, 20, 60_000)) {
    const sb = await getServerSupabase();
    await sb.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
