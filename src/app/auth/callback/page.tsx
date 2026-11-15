"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "../../../lib/auth-client";

export default function AuthCallback() {
  const [error, setError] = useState("");
  useEffect(() => {
    if (!authClient) { setError("Sign-in is not configured."); return; }
    authClient.auth.getSession().then(({ data, error: authError }) => {
      if (authError || !data.session) setError(authError?.message || "This sign-in link is invalid or has expired.");
      else window.location.replace("/workspace");
    });
  }, []);
  return <main className="min-h-screen bg-[#0e1116] p-8 text-slate-100"><p role="status">{error || "Completing sign-in…"}</p>{error && <Link className="text-amber-400 underline" href="/auth">Return to sign in</Link>}</main>;
}
