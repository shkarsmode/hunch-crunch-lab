import "server-only";
import { getAdminSupabase } from "@/lib/supabase/server";
import { PRICE_CENTS } from "@/lib/site";
import type { ProfileRow } from "@/lib/me";

const API = "https://www.patreon.com";
const DAY = 86_400_000;

type MemberAttrs = {
  patron_status?: string | null;
  currently_entitled_amount_cents?: number | null;
  lifetime_support_cents?: number | null;
  pledge_relationship_start?: string | null;
};

export type Membership = { patreonUserId: string; active: boolean; months: number; since: string | null };

export const redirectUri = (origin: string) => `${origin}/api/patreon/callback`;

export function authorizeUrl(origin: string, state: string) {
  const u = new URL(`${API}/oauth2/authorize`);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", process.env.PATREON_CLIENT_ID ?? "");
  u.searchParams.set("redirect_uri", redirectUri(origin));
  u.searchParams.set("scope", "identity");
  u.searchParams.set("state", state);
  return u;
}

export async function exchangeCode(code: string, origin: string) {
  const r = await fetch(`${API}/api/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: process.env.PATREON_CLIENT_ID ?? "",
      client_secret: process.env.PATREON_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri(origin),
    }),
    cache: "no-store",
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { access_token?: string };
  return j.access_token ?? null;
}

export function fromMember(patreonUserId: string, a: MemberAttrs | undefined): Membership {
  const cents = a?.currently_entitled_amount_cents ?? 0;
  const active = a?.patron_status === "active_patron" && cents >= PRICE_CENTS;
  const paid = Math.floor((a?.lifetime_support_cents ?? 0) / PRICE_CENTS);
  return { patreonUserId, active, months: Math.min(1200, Math.max(active ? 1 : 0, paid)), since: a?.pledge_relationship_start ?? null };
}

export async function fetchMembership(token: string): Promise<Membership | null> {
  const q = "include=memberships.campaign&fields%5Bmember%5D=patron_status,currently_entitled_amount_cents,lifetime_support_cents,pledge_relationship_start&fields%5Buser%5D=full_name";
  const r = await fetch(`${API}/api/oauth2/v2/identity?${q}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!r.ok) return null;
  const j = (await r.json()) as {
    data?: { id?: string };
    included?: { type: string; attributes?: MemberAttrs; relationships?: { campaign?: { data?: { id?: string } } } }[];
  };
  const uid = j.data?.id;
  if (!uid) return null;
  const campaign = process.env.PATREON_CAMPAIGN_ID;
  const m = (j.included ?? []).find((x) => x.type === "member" && x.relationships?.campaign?.data?.id === campaign);
  return fromMember(String(uid), m?.attributes);
}

export async function applyMembership(profileId: string, m: Membership): Promise<"ok" | "taken"> {
  const sb = getAdminSupabase();
  const { data: other } = await sb.from("profiles").select("id").eq("patreon_user_id", m.patreonUserId).neq("id", profileId).maybeSingle();
  if (other) return "taken";
  const { data: p } = await sb.from("profiles").select("supporter_until, supporter_comp").eq("id", profileId).maybeSingle<Pick<ProfileRow, "supporter_until" | "supporter_comp">>();
  const compUntil = p?.supporter_comp && p.supporter_until ? Date.parse(p.supporter_until) : 0;
  const patreonUntil = m.active ? Date.now() + 35 * DAY : Date.now();
  const until = new Date(Math.max(compUntil, patreonUntil)).toISOString();
  await sb
    .from("profiles")
    .update({
      patreon_user_id: m.patreonUserId,
      supporter_until: until,
      supporter_months: m.months,
      supporter_since: m.since,
      patreon_checked_at: new Date().toISOString(),
    })
    .eq("id", profileId);
  if (m.active) await sb.rpc("claim_founder", { p_user: profileId });
  return "ok";
}
