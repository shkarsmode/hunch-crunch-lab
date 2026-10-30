import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// New-format keys first: Supabase retires the legacy anon and service_role keys by the end of 2026.
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function supabaseConfigured() {
  return Boolean(URL && PUBLISHABLE && SECRET);
}

export async function getServerSupabase() {
  const store = await cookies();
  return createServerClient(URL, PUBLISHABLE, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {}
      },
    },
  });
}

let admin: SupabaseClient | null = null;

export function getAdminSupabase() {
  admin ??= createClient(URL, SECRET, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

export async function authReachable() {
  if (!supabaseConfigured()) return false;
  const res = await fetch(`${URL}/auth/v1/settings`, { headers: { apikey: PUBLISHABLE }, cache: "no-store" }).catch(() => null);
  return Boolean(res?.ok);
}

export async function currentUser(): Promise<User | null> {
  if (!supabaseConfigured()) return null;
  const sb = await getServerSupabase();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}
