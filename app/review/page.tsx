"use client";

import "../auth-layout.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Offer = {
  id: string;
  title: string;
  category: string;
  resource_type: string;
  provider_type: string;
  public_summary: string;
  city: string;
  quantity: number;
  unit: string;
  available_until: string | null;
  expiry_date: string | null;
  created_at: string;
};

export default function ReviewPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState<Record<string,string>>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  async function load() {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { router.replace("/auth"); return; }
    setEmail(user.email ?? "");
    const { data: access, error: accessError } = await supabase
      .from("reviewer_access").select("access_role,is_active").eq("user_id", user.id).maybeSingle();
    if (accessError || !access?.is_active) {
      setNotice("This account does not have active reviewer access. Contact a NEXORA administrator.");
      setReady(true);
      return;
    }
    const { data, error } = await supabase.from("resources")
      .select("id,title,category,resource_type,provider_type,public_summary,city,quantity,unit,available_until,expiry_date,created_at")
      .eq("status", "pending_review").order("created_at", { ascending: true });
    if (error) setNotice(error.message);
    else setOffers((data ?? []) as Offer[]);
    setReady(true);
  }

  useEffect(() => { void load(); }, []);

  async function decide(id: string, decision: "approved"|"rejected"|"changes_requested") {
    const note = (reason[id] ?? "").trim();
    if (note.length < 3) { setNotice("Add a review reason (at least 3 characters) before submitting."); return; }
    setBusy(id); setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("review_resource_offer", {
        p_resource_id: id, p_decision: decision, p_reason: note
      });
      if (error) throw error;
      setOffers(current => current.filter(item => item.id !== id));
      setReason(current => ({ ...current, [id]: "" }));
      setNotice(decision === "approved" ? "Offer approved and verified." : decision === "rejected" ? "Offer rejected and suspended." : "Changes requested; offer returned to draft.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not complete the review.");
    } finally { setBusy(null); }
  }

  if (!ready) return <main className="dashboard-shell"><p>Loading secure review queue…</p></main>;
  return <main className="dashboard-shell">
    <header className="dashboard-header">
      <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link>
      <div className="dashboard-user"><span>{email}</span><Link href="/dashboard">My workspace</Link></div>
    </header>
    <section className="dashboard-welcome">
      <span className="kicker">TRUST & SAFETY</span>
      <h1>Provider offer review</h1>
      <p>Verify the provider and the offer before it becomes visible to the community.</p>
    </section>
    {notice && <p className="form-message" role="status">{notice}</p>}
    <section className="review-list" aria-label="Pending provider offers">
      {offers.length === 0 ? <div className="dashboard-panel"><p className="empty-state">No offers are waiting for review.</p></div> :
        offers.map(offer => <article className="dashboard-panel review-card" key={offer.id}>
          <div className="review-card-head">
            <div><span className="kicker">{offer.resource_type.replaceAll("_"," ")}</span><h2>{offer.title}</h2><p>{offer.category} · {offer.city}</p></div>
            <span className="status-pill">Pending review</span>
          </div>
          <p className="review-summary">{offer.public_summary}</p>
          <dl className="review-meta">
            <div><dt>Provider type</dt><dd>{offer.provider_type.replaceAll("_"," ")}</dd></div>
            <div><dt>Quantity / capacity</dt><dd>{offer.quantity} {offer.unit}</dd></div>
            <div><dt>Submitted</dt><dd>{new Date(offer.created_at).toLocaleString()}</dd></div>
            {offer.available_until && <div><dt>Available until</dt><dd>{new Date(offer.available_until).toLocaleString()}</dd></div>}
            {offer.expiry_date && <div><dt>Expiry date</dt><dd>{offer.expiry_date}</dd></div>}
          </dl>
          {(offer.resource_type === "medicine" || offer.resource_type === "medical_consultation" || offer.resource_type === "accommodation") &&
            <p className="dashboard-safety">Sensitive offer: verify licenses, provider identity and applicable local requirements outside this form before approving. This screen alone does not establish eligibility.</p>}
          <label className="review-reason">Review note (required)
            <textarea rows={3} minLength={3} maxLength={1000} value={reason[offer.id] ?? ""} onChange={e => setReason(current => ({ ...current, [offer.id]: e.target.value }))} placeholder="Record the verification performed or what must change."/>
          </label>
          <div className="review-actions">
            <button className="button button-primary" disabled={busy === offer.id} onClick={() => void decide(offer.id,"approved")}>Approve & verify</button>
            <button className="review-secondary" disabled={busy === offer.id} onClick={() => void decide(offer.id,"changes_requested")}>Request changes</button>
            <button className="review-danger" disabled={busy === offer.id} onClick={() => void decide(offer.id,"rejected")}>Reject</button>
          </div>
        </article>)
      }
    </section>
    <p className="dashboard-safety">Only active reviewers can access this queue. Approving an offer records a reviewer decision; sensitive services still require their separate real-world credential and regulatory checks.</p>
  </main>;
}
