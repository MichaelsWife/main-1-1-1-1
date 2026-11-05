"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/account` } });
      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session) setMessage("Check your email to confirm your account, then sign in.");
      else window.location.href = new URLSearchParams(window.location.search).get("next") || "/account";
    } catch (error) { setMessage(error instanceof Error ? error.message : "Authentication failed."); }
    finally { setBusy(false); }
  }
  return <form className="auth-form" onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></label><button className="button dark-button" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>{message && <p role="status" className="form-message">{message}</p>}</form>;
}
