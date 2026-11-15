import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;
let cachedAdminClient: SupabaseClient | null = null;

/**
 * Checks if Supabase connection credentials are configured in the environment.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && url.startsWith("https://") && !url.includes("your-project"));
}

/**
 * Returns a standard client initialized with the anonymous public key.
 * Returns null if Supabase environment variables are missing.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;

  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
  });

  return cachedClient;
}

/**
 * Returns an administrative service-role client for server-side persistence.
 * Falls back to anon client if service role key is not provided.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cachedAdminClient) return cachedAdminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  cachedAdminClient = createClient(url, key, {
    auth: { persistSession: false },
  });

  return cachedAdminClient;
}
