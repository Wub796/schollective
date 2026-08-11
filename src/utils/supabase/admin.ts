import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely when SUPABASE_SERVICE_ROLE_KEY is present.
 * Defensively falls back to publishable key to prevent server crashes if service key is missing.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    console.warn("[createAdminClient] Supabase URL or Key missing in environment variables.");
  }

  return createClient(url || "", serviceKey || "", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
