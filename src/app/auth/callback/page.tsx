"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "../../../lib/auth-client";

export default function AuthCallback() {
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Authenticating with mission control...");

  useEffect(() => {
    if (!authClient) {
      setError("Sign-in is not configured.");
      return;
    }

    async function handleAuth() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const errorDescription = urlParams.get("error_description");

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (code) {
          setStatus("Verifying authorization code...");
          const { error: exchangeError } = await authClient!.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await authClient!.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) {
          throw new Error("Unable to establish verified session. Please try signing in again.");
        }

        setStatus("Access granted. Initializing researcher workspace...");
        window.location.replace("/workspace");
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err?.message || "This sign-in link is invalid or has expired.");
      }
    }

    handleAuth();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0e1116] p-6 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-md">
        {error ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Authentication Failed</h2>
            <p className="text-sm text-slate-400" role="alert">{error}</p>
            <div className="pt-2">
              <Link href="/auth" className="inline-flex items-center justify-center rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            <h2 className="text-lg font-semibold text-white">Completing Verification</h2>
            <p className="text-sm text-slate-400" role="status">{status}</p>
          </div>
        )}
      </div>
    </main>
  );
}
