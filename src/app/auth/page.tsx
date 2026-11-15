"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { useAuth } from "../../components/AuthProvider";

type Mode = "signin" | "signup" | "forgot" | "recovery";

export default function AuthPage() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "recovery") setMode("recovery");
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!authClient) { setMessage("Sign-in is not configured. Please contact the site administrator."); return; }
    setBusy(true); setMessage("");
    try {
      if (mode === "signin") {
        const { error } = await authClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign("/workspace");
      } else if (mode === "signup") {
        const { error } = await authClient.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) throw error;
        setMessage("Check your email for a confirmation link. If confirmation is disabled, you may already be signed in.");
      } else if (mode === "forgot") {
        const { error } = await authClient.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?mode=recovery` });
        if (error) throw error;
        setMessage("If this address has an account, a password reset link will arrive shortly.");
      } else {
        const { error } = await authClient.auth.updateUser({ password });
        if (error) throw error;
        setMessage("Password updated. You can return to your workspace.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to complete this request."); }
    finally { setBusy(false); }
  }

  async function google() {
    if (!authClient) { setMessage("Sign-in is not configured."); return; }
    setBusy(true); setMessage("");
    const { error } = await authClient.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) { setMessage(error.message); setBusy(false); }
  }

  return <main className="min-h-screen bg-[#0e1116] px-4 py-12 text-slate-100">
    <div className="mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8">
      <Link href="/" className="text-sm text-amber-400">← Explore IGNIS</Link>
      <h1 className="mt-6 text-2xl font-semibold">{mode === "signup" ? "Create researcher account" : mode === "forgot" ? "Reset your password" : mode === "recovery" ? "Choose a new password" : "Researcher sign in"}</h1>
      <p className="mt-2 text-sm text-slate-400">Your research library stays public. Your saved work belongs to your account.</p>
      {!loading && session && mode !== "recovery" && <p className="mt-4 text-sm text-emerald-300">Signed in as {session.user.email}. <Link className="underline" href="/workspace">Open workspace</Link></p>}
      {(mode === "signin" || mode === "signup") && <button type="button" disabled={busy} onClick={google} className="mt-6 w-full rounded-lg border border-slate-600 px-4 py-3 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">Continue with Google</button>}
      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode !== "recovery" && <label className="block text-sm">Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2" /></label>}
        {mode !== "forgot" && <label className="block text-sm">Password<input required minLength={6} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2" /></label>}
        <button disabled={busy || (mode === "recovery" && !session)} className="w-full rounded-lg bg-amber-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}</button>
      </form>
      {message && <p role="status" className="mt-4 text-sm text-amber-200">{message}</p>}
      {mode === "recovery" && !loading && !session && <p role="alert" className="mt-4 text-sm text-amber-200">This reset link is invalid or expired. Request a new link.</p>}
      <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-300">
        {mode !== "signin" && <button type="button" onClick={() => { setMode("signin"); setMessage(""); }}>Sign in</button>}
        {mode === "signin" && <><button type="button" onClick={() => { setMode("signup"); setMessage(""); }}>Create account</button><button type="button" onClick={() => { setMode("forgot"); setMessage(""); }}>Forgot password?</button></>}
      </div>
    </div>
  </main>;
}
