"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { useAuth } from "../../components/AuthProvider";
import { Flame, Mail, Lock, User, Eye, EyeOff, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

type Mode = "signin" | "signup" | "forgot" | "recovery";

export default function AuthPage() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const modeParam = new URLSearchParams(window.location.search).get("mode");
      if (modeParam === "recovery") setMode("recovery");
      else if (modeParam === "signup") setMode("signup");
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!authClient) {
      setMessage("Sign-in system is not configured. Please contact mission control.");
      setMessageType("error");
      return;
    }
    setBusy(true);
    setMessage("");

    try {
      if (mode === "signin") {
        const { error } = await authClient.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setMessageType("success");
        setMessage("Authentication verified. Redirecting to workspace...");
        window.location.assign("/workspace");
      } else if (mode === "signup") {
        const { error } = await authClient.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || undefined,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessageType("success");
        setMessage("Account created. Check your inbox for confirmation if required, or sign in now.");
      } else if (mode === "forgot") {
        const { error } = await authClient.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth?mode=recovery`,
        });
        if (error) throw error;
        setMessageType("info");
        setMessage("If this email address exists in the registry, a password reset link has been dispatched.");
      } else {
        const { error } = await authClient.auth.updateUser({ password });
        if (error) throw error;
        setMessageType("success");
        setMessage("Password successfully updated. You may now return to your workspace.");
      }
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to complete authentication request.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!authClient) {
      setMessage("Authentication client is not configured.");
      setMessageType("error");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await authClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setMessageType("error");
      setMessage(error.message);
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0e1116] px-4 py-12 text-slate-100">
      <div className="w-full max-w-md">
        {/* Navigation back */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400/90 transition hover:text-amber-300 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Research Library
          </Link>
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>NASA Protected</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <Flame className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {mode === "signup"
                ? "Create Researcher Account"
                : mode === "forgot"
                ? "Reset Credentials"
                : mode === "recovery"
                ? "Set New Password"
                : "Mission Specialist Sign In"}
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">
              IGNIS Microgravity Combustion Intelligence Workspace
            </p>
          </div>

          {/* Active Session Warning */}
          {!loading && session && mode !== "recovery" && (
            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
              <div className="flex items-center justify-between">
                <span>Signed in as <strong>{session.user.email}</strong></span>
                <Link href="/workspace" className="font-semibold underline hover:text-emerald-200">
                  Open Workspace →
                </Link>
              </div>
            </div>
          )}

          {/* Mode Tabs */}
          {(mode === "signin" || mode === "signup") && (
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-950 p-1 ring-1 ring-slate-800">
              <button
                type="button"
                onClick={() => { setMode("signin"); setMessage(""); }}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  mode === "signin"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setMessage(""); }}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  mode === "signup"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Google OAuth Button */}
          {(mode === "signin" || mode === "signup") && (
            <div className="mt-5">
              <button
                type="button"
                disabled={busy}
                onClick={google}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950/80 px-4 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800/90 focus:outline-none focus:ring-2 focus:ring-amber-400/30 disabled:opacity-50"
              >
                <svg className="h-5 w-5 shrink-0" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative my-5 flex items-center justify-center">
                <div className="w-full border-t border-slate-800" />
                <span className="absolute bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500">
                  or email credentials
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Researcher Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Dr. Alex Mercer"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-600 transition focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>
            )}

            {mode !== "recovery" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="researcher@nasa.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-600 transition focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>
            )}

            {mode !== "forgot" && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    {mode === "recovery" ? "New Security Key (Password)" : "Security Key (Password)"}
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setMessage(""); }}
                      className="text-[11px] text-amber-400/80 hover:text-amber-300 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    required
                    minLength={6}
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-10 text-sm text-slate-100 placeholder-slate-600 transition focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy || (mode === "recovery" && !session)}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-50"
            >
              {busy ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Verifying Credentials…</span>
                </div>
              ) : mode === "signin" ? (
                "Authenticate & Sign In"
              ) : mode === "signup" ? (
                "Create Researcher Account"
              ) : mode === "forgot" ? (
                "Dispatch Reset Link"
              ) : (
                "Update Security Password"
              )}
            </button>
          </form>

          {/* Feedback Messages */}
          {message && (
            <div
              className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                messageType === "error"
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
                  : messageType === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-300"
              }`}
              role={messageType === "error" ? "alert" : "status"}
            >
              {messageType === "error" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              )}
              <span>{message}</span>
            </div>
          )}

          {/* Bottom links */}
          {mode === "forgot" && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => { setMode("signin"); setMessage(""); }}
                className="text-xs text-slate-400 hover:text-slate-200 hover:underline"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
