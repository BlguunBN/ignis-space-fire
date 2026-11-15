import { createClient } from "@supabase/supabase-js";
import { bearerToken } from "./auth-boundaries";
import { getSupabaseAdmin } from "./supabase";

export async function authenticateResearcher(request: Request) {
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}

export async function isReviewer(userId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data, error } = await admin.from("researcher_roles").select("role").eq("user_id", userId).maybeSingle();
  return !error && (data?.role === "reviewer" || data?.role === "admin");
}
