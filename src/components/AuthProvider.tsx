"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { authClient } from "../lib/auth-client";

const AuthContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!authClient) { setLoading(false); return; }
    let active = true;
    authClient.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false); } });
    const { data } = authClient.auth.onAuthStateChange((_event, next) => { if (active) { setSession(next); setLoading(false); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
