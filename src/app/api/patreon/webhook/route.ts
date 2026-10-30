import { createHmac } from "node:crypto";
import { applyMembership, fromMember } from "@/lib/patreon";
import { getAdminSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { equalSecret } from "@/lib/http";

type Payload = {
  data?: {
    type?: string;
    attributes?: Record<string, unknown>;
    relationships?: { user?: { data?: { id?: string } }; campaign?: { data?: { id?: string } } };
  };
};

export async function POST(request: Request) {
  const secret = process.env.PATREON_WEBHOOK_SECRET;
  if (!secret || !supabaseConfigured()) return new Response(null, { status: 404 });
  const raw = await request.text();
  if (raw.length > 100_000) return new Response(null, { status: 413 });
  const sig = request.headers.get("x-patreon-signature") ?? "";
  const want = createHmac("md5", secret).update(raw).digest("hex");
  if (!sig || !equalSecret(sig, want)) return new Response(null, { status: 401 });
  let body: Payload;
  try {
    body = JSON.parse(raw) as Payload;
  } catch {
    return new Response(null, { status: 400 });
  }
  const d = body.data;
  const uid = d?.relationships?.user?.data?.id;
  if (d?.type !== "member" || !uid || d.relationships?.campaign?.data?.id !== process.env.PATREON_CAMPAIGN_ID) return new Response(null, { status: 204 });
  const event = request.headers.get("x-patreon-event") ?? "";
  const m = fromMember(String(uid), event.endsWith(":delete") ? undefined : (d.attributes as never));
  const { data: p } = await getAdminSupabase().from("profiles").select("id").eq("patreon_user_id", String(uid)).maybeSingle();
  if (p) await applyMembership(p.id as string, m);
  return new Response(null, { status: 204 });
}
