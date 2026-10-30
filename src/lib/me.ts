import "server-only";
import type { User } from "@supabase/supabase-js";
import { DEFAULT_FLAGS } from "@/lib/flags";
import { currentUser, getAdminSupabase, supabaseConfigured } from "@/lib/supabase/server";

export type Me = {
  configured: boolean;
  patreon: boolean;
  user: { id: string; email: string; name: string; avatar: string | null } | null;
  role: "user" | "admin";
  supporter: { active: boolean; months: number; founderNo: number | null; onWall: boolean; wallName: string | null; until: string | null } | null;
  flags: Record<string, boolean>;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  supporter_until: string | null;
  supporter_since: string | null;
  supporter_months: number;
  supporter_comp: boolean;
  founder_no: number | null;
  show_on_wall: boolean;
  wall_name: string | null;
  patreon_user_id: string | null;
  patreon_checked_at: string | null;
  created_at: string;
  last_seen_at: string | null;
};

export function patreonConfigured() {
  return Boolean(process.env.PATREON_CLIENT_ID && process.env.PATREON_CLIENT_SECRET && process.env.PATREON_CAMPAIGN_ID);
}

export const isActive = (p: Pick<ProfileRow, "supporter_until">) => Boolean(p.supporter_until && Date.parse(p.supporter_until) > Date.now());

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

let flagCache: { at: number; flags: Record<string, boolean> } | null = null;

export function dropFlagCache() {
  flagCache = null;
}

export async function loadFlags(): Promise<Record<string, boolean>> {
  if (!supabaseConfigured()) return { ...DEFAULT_FLAGS };
  if (flagCache && Date.now() - flagCache.at < 60_000) return flagCache.flags;
  const { data } = await getAdminSupabase().from("flags").select("key, enabled");
  const flags = { ...DEFAULT_FLAGS };
  for (const r of data ?? []) if (r.key in DEFAULT_FLAGS) flags[r.key as string] = Boolean(r.enabled);
  flagCache = { at: Date.now(), flags };
  return flags;
}

export async function ensureProfile(user: User): Promise<ProfileRow> {
  const sb = getAdminSupabase();
  const email = (user.email ?? "").toLowerCase();
  const verified = Boolean(user.email_confirmed_at) || user.app_metadata?.provider === "google";
  const meta = user.user_metadata ?? {};
  const name = String(meta.full_name || meta.name || email.split("@")[0] || "Player").slice(0, 80);
  const avatar = String(meta.avatar_url || meta.picture || "").slice(0, 500) || null;
  const { data: existing } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle<ProfileRow>();
  const role = verified && adminEmails().includes(email) ? "admin" : (existing?.role ?? "user");
  const fresh = existing?.last_seen_at && Date.now() - Date.parse(existing.last_seen_at) < 10 * 60_000;
  if (existing && fresh && existing.role === role) return existing;
  const patch: Record<string, unknown> = { id: user.id, email, avatar_url: avatar, role, last_seen_at: new Date().toISOString() };
  if (!existing) patch.name = name;
  const { data } = await sb.from("profiles").upsert(patch).select("*").single<ProfileRow>();
  return (data ?? existing) as ProfileRow;
}

export async function loadMe(): Promise<Me> {
  const configured = supabaseConfigured();
  const flags = await loadFlags();
  const base: Me = { configured, patreon: patreonConfigured(), user: null, role: "user", supporter: null, flags };
  if (!configured) return base;
  const user = await currentUser();
  if (!user) return base;
  const p = await ensureProfile(user);
  if (!p) return base;
  return {
    ...base,
    user: { id: p.id, email: p.email ?? "", name: p.name ?? "Player", avatar: p.avatar_url },
    role: p.role,
    supporter: {
      active: isActive(p),
      months: p.supporter_months,
      founderNo: p.founder_no,
      onWall: p.show_on_wall,
      wallName: p.wall_name,
      until: p.supporter_until,
    },
  };
}

export async function requireUser() {
  if (!supabaseConfigured()) return null;
  const user = await currentUser();
  if (!user) return null;
  return ensureProfile(user);
}

export async function requireAdmin(): Promise<ProfileRow | null> {
  const p = await requireUser();
  return p?.role === "admin" ? p : null;
}
