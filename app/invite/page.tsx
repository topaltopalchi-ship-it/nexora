"use client";

import "../auth-layout.css";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AcceptOrganizationInvitePage() {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const router = useRouter();

  async function accept(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.push("/auth"); return; }
      if (!user.email) throw new Error("Your account needs a verified email address.");
      const { error } = await supabase.rpc("accept_organization_invitation", { p_token: token.trim() });
      if (error) throw error;
      router.push("/provider");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not accept invitation.");
    } finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <section className="auth-card">
      <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA</span></Link>
      <span className="kicker">ORGANIZATION INVITATION</span>
      <h1>Join an organization</h1>
      <p>Sign in using the email address the organization invited, then enter your one-time invitation token.</p>
      {notice && <p className="form-message" role="status">{notice}</p>}
      <form className="auth-form" onSubmit={accept}>
        <label>Invitation token<input value={token} onChange={event => setToken(event.target.value)} required minLength={32} maxLength={128} autoComplete="off" /></label>
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Accepting…" : "Accept invitation"}</button>
      </form>
      <p className="dashboard-safety">Tokens expire after seven days, work once, and are bound to the invited account email. Never forward a token to another person.</p>
    </section>
  </main>;
}
