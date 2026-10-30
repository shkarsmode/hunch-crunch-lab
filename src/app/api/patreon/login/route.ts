import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { authorizeUrl } from "@/lib/patreon";
import { patreonConfigured, requireUser } from "@/lib/me";
import { ipOf } from "@/lib/http";
import { allow } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const back = (q: string) => NextResponse.redirect(new URL(`/support?patreon=${q}`, origin));
  if (!patreonConfigured()) return back("off");
  if (!allow(`pl:${ipOf(request)}`, 10, 60_000)) return back("slow");
  const profile = await requireUser();
  if (!profile) return back("signin");
  const state = randomBytes(24).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(origin, state));
  res.cookies.set("hc_pstate", state, { httpOnly: true, secure: origin.startsWith("https"), sameSite: "lax", maxAge: 600, path: "/api/patreon" });
  return res;
}
