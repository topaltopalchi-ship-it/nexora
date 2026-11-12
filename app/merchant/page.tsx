"use client";

import "./merchant.css";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Store = {
  id: string;
  name: string;
  district: string;
  description: string;
  verification_status: string;
  voice_enabled: boolean;
};

type VoiceSession = {
  id: string;
  store_id: string;
  customer_id: string;
  status: string;
  created_at: string;
};

export default function MerchantDashboard() {
  const [store, setStore] = useState<Store | null>(null);
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    const { data: stores } = await supabase
      .from("market_stores")
      .select("id,name,district,description,verification_status,voice_enabled")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const current = stores?.[0] ?? null;
    setStore(current);

    if (current) {
      const { data } = await supabase
        .from("market_voice_sessions")
        .select("id,store_id,customer_id,status,created_at")
        .eq("store_id", current.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setSessions(data ?? []);
    } else {
      setSessions([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Seller dashboard intentionally polls for requests so it works without
    // requiring a realtime channel to be provisioned first.
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, []);

  async function createStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingStore(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    const { error } = await supabase.from("market_stores").insert({
      owner_id: user.id,
      name: String(form.get("name") ?? ""),
      district: String(form.get("district") ?? ""),
      description: String(form.get("description") ?? ""),
      verification_status: "pending",
      voice_enabled: true,
    });

    if (error) setMessage(error.message);
    else {
      setMessage("Store submitted for verification.");
      await load();
    }
    setSavingStore(false);
  }

  async function updateSession(id: string, status: "accepted" | "declined" | "active" | "ended") {
    const { error } = await supabase.from("market_voice_sessions").update({ status }).eq("id", id);
    if (error) setMessage(error.message);
    else await load();
  }

  if (loading) return <main className="merchant-shell"><div className="merchant-loading">Loading merchant workspace…</div></main>;

  return (
    <main className="merchant-shell" dir="ltr">
      <header className="merchant-nav">
        <a href="/" className="merchant-brand">NEXORA <span>AI</span></a>
        <div className="merchant-label">MERCHANT WORKSPACE · TABRIZ</div>
        <a href="/marketplace" className="merchant-market">Open marketplace ↗</a>
      </header>

      <section className="merchant-hero">
        <div>
          <span className="merchant-kicker">SELLER CONTROL CENTER</span>
          <h1>Your store, <em>always open.</em></h1>
          <p>Manage your verified storefront and answer customer voice requests from one place.</p>
        </div>
        <div className="merchant-status">
          <span className="status-dot" />
          {store ? store.verification_status.toUpperCase() : "NOT REGISTERED"}
        </div>
      </section>

      {!store ? (
        <section className="merchant-card">
          <span className="merchant-kicker">01 — ONBOARD</span>
          <h2>Register your store</h2>
          <p className="muted">A NEXORA reviewer verifies the store before it becomes publicly discoverable.</p>
          <form onSubmit={createStore} className="merchant-form">
            <label>Store name<input name="name" required placeholder="e.g. Tabriz Leather House" /></label>
            <label>District<input name="district" required placeholder="e.g. Valiasr" /></label>
            <label>Description<textarea name="description" required minLength={10} placeholder="Tell customers what you sell and what makes your store useful." /></label>
            <button disabled={savingStore}>{savingStore ? "Submitting…" : "Submit store for review"}</button>
          </form>
          {message && <p className="merchant-message">{message}</p>}
        </section>
      ) : (
        <div className="merchant-grid">
          <section className="merchant-card">
            <span className="merchant-kicker">01 — STOREFRONT</span>
            <h2>{store.name}</h2>
            <p className="muted">{store.district} · {store.description}</p>
            <div className="store-meta">
              <span>Verification <b>{store.verification_status}</b></span>
              <span>Voice <b>{store.voice_enabled ? "Enabled" : "Disabled"}</b></span>
            </div>
            {message && <p className="merchant-message">{message}</p>}
          </section>

          <section className="merchant-card">
            <span className="merchant-kicker">02 — VOICE QUEUE</span>
            <h2>Customer requests</h2>
            <div className="voice-queue">
              {sessions.length === 0 && <p className="muted">No customer requests yet.</p>}
              {sessions.map(session => (
                <div className="voice-request" key={session.id}>
                  <div>
                    <b>{session.status === "requested" ? "New voice request" : "Voice session"}</b>
                    <small>{new Date(session.created_at).toLocaleString()}</small>
                  </div>
                  <span className={"session-status " + session.status}>{session.status}</span>
                  {session.status === "requested" && (
                    <div className="request-actions">
                      <button onClick={() => updateSession(session.id, "accepted")}>Accept</button>
                      <button className="ghost" onClick={() => updateSession(session.id, "declined")}>Decline</button>
                    </div>
                  )}
                  {session.status === "accepted" && (
                    <button onClick={() => updateSession(session.id, "active")}>Start call</button>
                  )}
                  {session.status === "active" && (
                    <button onClick={() => updateSession(session.id, "ended")}>End call</button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
