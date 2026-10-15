"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signup" | "login";

export default function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      if (!data.session) {
        setError("Your account was created but you are not logged in. Email confirmation must be turned off in Supabase.");
        setBusy(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === "Invalid login credentials" ? "Wrong email or password. Please try again." : error.message);
        setBusy(false);
        return;
      }
    }

    window.location.assign("/app");
  }

  return (
    <div className="auth-card card">
      <h1>{isSignup ? "Create your free account" : "Welcome back"}</h1>
      <p className="muted">
        {isSignup ? "Start tracking your spending in under a minute." : "Log in to see your budget."}
      </p>

      <form onSubmit={onSubmit} className="stack" noValidate={false}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid={isSignup ? "signup-email" : "login-email"}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={isSignup ? "password-hint" : undefined}
            data-testid={isSignup ? "signup-password" : "login-password"}
          />
          {isSignup && (
            <p id="password-hint" className="hint">
              At least 6 characters.
            </p>
          )}
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={busy}
          data-testid={isSignup ? "signup-submit" : "login-submit"}
        >
          {busy ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
        </button>
      </form>

      <p className="muted small center">
        {isSignup ? (
          <>
            Already have an account? <Link href="/login">Log in</Link>
          </>
        ) : (
          <>
            New to Pocket? <Link href="/signup">Create an account</Link>
          </>
        )}
      </p>
    </div>
  );
}
