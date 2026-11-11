"use client";

import "../auth-layout.css";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";
export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("en");
  const [accountType, setAccountType] = useState("individual");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: name.trim(), preferred_language: language, account_type: accountType } }
        });
        if (error) throw error;
        if (data.session) router.push("/dashboard");
        else setMessage("Account created. Check your email to confirm your address, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err) { setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link>
    <section className="auth-card">
      <span className="kicker">YOUR NEXORA ACCOUNT</span>
      <h1>{mode === "signup" ? "Join a more connected community." : "Welcome back."}</h1>
      <p className="auth-subtitle">{mode === "signup" ? "Create an account to request support or contribute verified resources." : "Sign in to manage your requests and resources."}</p>
      <div className="auth-tabs"><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => {setMode("signup");setMessage("");}}>Create account</button><button type="button" className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setMessage("");}}>Sign in</button></div>
      <form onSubmit={submit} className="auth-form">
        {mode === "signup" && <>
          <label>Full name<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required minLength={2} maxLength={80} placeholder="Your name"/></label>
          <label>Account purpose<select value={accountType} onChange={e=>setAccountType(e.target.value)}><option value="individual">I need support</option><option value="provider">I can offer support</option><option value="organization">Organization</option><option value="volunteer">Volunteer</option></select></label>
          <label>Preferred language<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="ar">العربية</option><option value="fa">فارسی</option></select></label>
        </>}
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com"/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} placeholder="At least 8 characters"/></label>
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create my account" : "Sign in"} <span>↗</span></button>
      </form>
      {message && <p className="form-message" role="status">{message}</p>}
      <p className="auth-privacy">Your account details are protected by Supabase authentication. Never share your password with anyone.</p>
    </section>
    <Link className="auth-back" href="/">← Back to NEXORA</Link>
  </main>;
}
