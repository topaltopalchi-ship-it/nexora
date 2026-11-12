"use client";

import "../auth-layout.css";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Row = { id:string; title:string; category:string; status:string; city:string; created_at:string };
export default function DashboardPage() {
  const [email,setEmail] = useState("");
  const [tab,setTab] = useState<"need"|"resource">("need");
  const [needs,setNeeds] = useState<Row[]>([]);
  const [resources,setResources] = useState<Row[]>([]);
  const [category,setCategory] = useState("food");
  const [title,setTitle] = useState("");
  const [description,setDescription] = useState("");
  const [city,setCity] = useState("Dubai");
  const [urgency,setUrgency] = useState("3");
  const [peopleCount,setPeopleCount] = useState("1");
  const [preferredLanguage,setPreferredLanguage] = useState<"en"|"ar"|"fa">("en");
  const [resourceType,setResourceType] = useState("food_parcels");
  const [providerType,setProviderType] = useState("individual");
  const [quantity,setQuantity] = useState("1");
  const [unit,setUnit] = useState("items");
  const [availableUntil,setAvailableUntil] = useState("");
  const [expiryDate,setExpiryDate] = useState("");
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");
  const [ready,setReady] = useState(false);
  const router = useRouter();

  async function load() {
    const supabase = createClient();
    const {data:{user},error} = await supabase.auth.getUser();
    if(error || !user) { router.replace("/auth"); return; }
    setEmail(user.email ?? "");
    const [n,r] = await Promise.all([
      supabase.from("needs").select("id,title,category,status,city,created_at").order("created_at",{ascending:false}),
      supabase.from("resources").select("id,title,category,status,city,created_at").order("created_at",{ascending:false})
    ]);
    if(n.error) setNotice(n.error.message); else setNeeds((n.data ?? []) as Row[]);
    if(r.error) setNotice(r.error.message); else setResources((r.data ?? []) as Row[]);
    setReady(true);
  }
  useEffect(()=>{ void load(); },[]);

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setNotice("");
    try {
      const supabase = createClient();
      const {data:{user}} = await supabase.auth.getUser();
      if(!user) { router.replace("/auth"); return; }
      if(tab === "need") {
        const {error} = await supabase.from("needs").insert({requester_id:user.id,category,title:title.trim(),description:description.trim(),city,urgency:Number(urgency),people_count:Number(peopleCount),preferred_language:preferredLanguage,status:"open"});
        if(error) throw error;
      } else {
        const categoryForResource = resourceType === "meals" || resourceType === "food_parcels" ? "food" : resourceType === "medical_consultation" || resourceType === "medicine" ? "healthcare" : resourceType === "accommodation" ? "housing" : "other";
        const {error} = await supabase.from("resources").insert({provider_id:user.id,category:categoryForResource,resource_type:resourceType,provider_type:providerType,title:title.trim(),public_summary:description.trim(),city,quantity:Number(quantity),unit,available_until:availableUntil ? new Date(availableUntil).toISOString() : null,expiry_date:expiryDate || null,status:"pending_review"});
        if(error) throw error;
      }
      setTitle(""); setDescription(""); setUrgency("3"); setPeopleCount("1"); setQuantity("1"); setAvailableUntil(""); setExpiryDate(""); setNotice(tab === "need" ? "Your request has been submitted." : "Your resource is submitted and waiting for verification.");
      await load();
    } catch(err) { setNotice(err instanceof Error ? err.message : "Could not submit. Please try again."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    const supabase=createClient(); await supabase.auth.signOut(); router.replace("/");
  }

  if(!ready) return <main className="dashboard-shell"><p>Loading your secure workspace…</p></main>;
  return <main className="dashboard-shell">
    <header className="dashboard-header"><Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link><div className="dashboard-user"><span>{email}</span><button onClick={signOut}>Sign out</button></div></header>
    <section className="dashboard-welcome"><span className="kicker">YOUR WORKSPACE</span><h1>Welcome to NEXORA.</h1><p>Manage your support requests and the resources you can share.</p></section>
    <section className="dashboard-grid">
      <div className="dashboard-panel">
        <div className="auth-tabs"><button className={tab==="need"?"active":""} onClick={()=>{setTab("need");setNotice("");}}>Request support</button><button className={tab==="resource"?"active":""} onClick={()=>{setTab("resource");setNotice("");}}>Offer a resource</button></div>
        <form className="auth-form" onSubmit={submit}>
          {tab === "need" && <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="food">Food</option><option value="healthcare">Healthcare</option><option value="housing">Housing</option><option value="transport">Transport</option><option value="other">Other</option></select></label>}
          {tab === "resource" && <>
            <label>What kind of help are you offering?<select value={resourceType} onChange={e=>setResourceType(e.target.value)}>
              <option value="food_parcels">Food parcels / groceries</option><option value="meals">Prepared meals / restaurant meals</option><option value="clothing">Clothing</option><option value="medicine" disabled={providerType !== "pharmacy"}>Medicines (licensed pharmacies only)</option><option value="medical_consultation" disabled={providerType !== "healthcare_provider"}>Free medical consultation (licensed providers)</option><option value="accommodation" disabled={providerType !== "accommodation_provider" && providerType !== "charity"}>Temporary accommodation / sleeping space (approved providers)</option><option value="transport">Transport</option><option value="other">Other support</option>
            </select></label>
            <label>Provider type<select value={providerType} onChange={e=>{const next=e.target.value;setProviderType(next);if((resourceType==="medicine"&&next!=="pharmacy")||(resourceType==="medical_consultation"&&next!=="healthcare_provider")||(resourceType==="accommodation"&&next!=="accommodation_provider"&&next!=="charity"))setResourceType("food_parcels");}}><option value="individual">Individual volunteer</option><option value="restaurant">Restaurant / food business</option><option value="healthcare_provider">Licensed healthcare provider</option><option value="pharmacy">Licensed pharmacy</option><option value="charity">Charity / NGO</option><option value="accommodation_provider">Accommodation provider</option><option value="company">Company / other organization</option></select></label>
          </>}
          <label>{tab==="need"?"What support do you need?":"What can you provide?"}<input value={title} onChange={e=>setTitle(e.target.value)} required minLength={4} maxLength={120} placeholder={tab==="need"?"e.g. Grocery support":"e.g. Sealed food parcels"}/></label>
          <label>Details<textarea value={description} onChange={e=>setDescription(e.target.value)} required minLength={10} maxLength={1000} rows={4} placeholder="Share only the information needed. Do not include medical records or sensitive identity details."/></label>
          {tab === "resource" && <>
            <label>Quantity or capacity<input type="number" min="1" max="10000" value={quantity} onChange={e=>setQuantity(e.target.value)} required/></label>
            <label>Unit<select value={unit} onChange={e=>setUnit(e.target.value)}><option value="items">Items</option><option value="meals">Meals</option><option value="food_parcels">Food parcels</option><option value="people">People / places</option><option value="consultations">Consultations</option><option value="hours">Hours</option><option value="sets">Sets</option></select></label>
            <label>Available until (optional)<input type="datetime-local" value={availableUntil} onChange={e=>setAvailableUntil(e.target.value)}/></label>
            {resourceType === "medicine" && <label>Medicine expiry date<input type="date" value={expiryDate} onChange={e=>setExpiryDate(e.target.value)}/></label>}
            {resourceType === "medicine" && <p className="dashboard-safety">Medicine offers are not published or matched automatically. Only licensed pharmacies or authorized organizations may proceed after verification and local regulatory review. Person-to-person medicine transfers are not supported.</p>}
            {resourceType === "medical_consultation" && <p className="dashboard-safety">Clinical services require provider credential verification. NEXORA does not triage, diagnose, or recommend treatment.</p>}
            {resourceType === "accommodation" && <p className="dashboard-safety">Accommodation offers require human review and provider confirmation before any referral. Do not publish a private home address.</p>}
          </>}
          <label>City or area in Dubai<input value={city} onChange={e=>setCity(e.target.value)} required maxLength={100} placeholder="e.g. Deira, Al Barsha, Bur Dubai"/></label>
          {tab === "need" && <>
            <label>Urgency<select value={urgency} onChange={e=>setUrgency(e.target.value)}><option value="1">1 — Can wait</option><option value="2">2 — Low</option><option value="3">3 — Normal</option><option value="4">4 — High</option><option value="5">5 — Urgent — not an emergency service</option></select></label>
            <label>Number of people needing support<input type="number" min="1" max="100" value={peopleCount} onChange={e=>setPeopleCount(e.target.value)} required/></label>
            <label>Preferred contact language<select value={preferredLanguage} onChange={e=>setPreferredLanguage(e.target.value as "en"|"ar"|"fa")}><option value="en">English</option><option value="ar">العربية</option><option value="fa">فارسی</option></select></label>
          </>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy?"Submitting…":tab==="need"?"Submit request":"Submit for verification"} <span>↗</span></button>
        </form>
        {notice && <p className="form-message" role="status">{notice}</p>}
      </div>
      <div className="dashboard-panel activity-panel">
        <h2>Your activity</h2><h3>Support requests <span>{needs.length}</span></h3>
        {needs.length===0?<p className="empty-state">No requests yet.</p>:needs.map(x=><article className="activity-row" key={x.id}><div><strong>{x.title}</strong><small>{x.category} · {x.city}</small></div><span className="status-pill">{x.status}</span></article>)}
        <h3 className="resources-heading">Your resources <span>{resources.length}</span></h3>
        {resources.length===0?<p className="empty-state">No resources submitted yet.</p>:resources.map(x=><article className="activity-row" key={x.id}><div><strong>{x.title}</strong><small>{x.category} · {x.city}</small></div><span className="status-pill">{x.status}</span></article>)}
      </div>
    </section>
    <p className="dashboard-safety">Offers stay private until reviewed and verified. Availability is not guaranteed until the provider confirms it. Medicines, clinical services, and accommodation require additional checks. NEXORA is not an emergency service or a healthcare provider.</p>
  </main>;
}
