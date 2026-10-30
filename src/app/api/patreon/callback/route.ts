import { NextResponse, type NextRequest } from "next/server";
import { applyMembership, exchangeCode, fetchMembership } from "@/lib/patreon";
import { patreonConfigured, requireUser } from "@/lib/me";
import { equalSecret, ipOf } from "@/lib/http";
import { allow } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const back = (q: string) => {
    const r = NextResponse.redirect(new URL(`/support?patreon=${q}`, url.origin));
    r.cookies.set("hc_pstate", "", { maxAge: 0, path: "/api/patreon" });
    return r;
  };
  if (!patreonConfigured()) return back("off");
  if (!allow(`pc:${ipOf(request)}`, 10, 60_000)) return back("slow");
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const saved = request.cookies.get("hc_pstate")?.value ?? "";
  if (!state || !code || !saved || !equalSecret(state, saved)) return back("error");
  const profile = await requireUser();
  if (!profile) return back("signin");
  const token = await exchangeCode(code, url.origin);
  if (!token) return back("error");
  const m = await fetchMembership(token);
  if (!m) return back("error");
  const r = await applyMembership(profile.id, m);
  if (r === "taken") return back("taken");
  return back(m.active ? "ok" : "inactive");
}
