import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function supabaseConfigured() {
  return Boolean(URL && ANON && SERVICE);
}

export async function getServerSupabase() {
  const store = await cookies();
  return createServerClient(URL, ANON, {
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
  admin ??= createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

export async function currentUser(): Promise<User | null> {
  if (!supabaseConfigured()) return null;
  const sb = await getServerSupabase();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}
