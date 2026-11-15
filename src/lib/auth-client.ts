"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const authClient = url && key ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const session = (await authClient?.auth.getSession())?.data.session;
  const headers = new Headers(init.headers);
  if (session) headers.set("Authorization", `Bearer ${session.access_token}`);
  return fetch(input, { ...init, headers });
}
