import { loadMe } from "@/lib/me";
import { NO_STORE, fail, ipOf } from "@/lib/http";
import { allow } from "@/lib/rate-limit";

export async function GET(request: Request) {
  if (!allow(`me:${ipOf(request)}`, 60, 60_000)) return fail(429, "slow down");
  const me = await loadMe();
  return Response.json(me, { headers: NO_STORE });
}
