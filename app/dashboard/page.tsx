"use client";

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
        const {error} = await supabase.from("needs").insert({requester_id:user.id,category,title:title.trim(),description:description.trim(),city,preferred_language:"en",status:"open"});
        if(error) throw error;
      } else {
        const {error} = await supabase.from("resources").insert({provider_id:user.id,category,title:title.trim(),public_summary:description.trim(),city,quantity:1,status:"pending_review"});
        if(error) throw error;
      }
      setTitle(""); setDescription(""); setNotice(tab === "need" ? "Your request has been submitted." : "Your resource is submitted and waiting for verification.");
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
          <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="food">Food</option><option value="healthcare">Healthcare</option><option value="housing">Housing</option><option value="transport">Transport</option><option value="other">Other</option></select></label>
          <label>{tab==="need"?"What support do you need?":"What can you provide?"}<input value={title} onChange={e=>setTitle(e.target.value)} required minLength={4} maxLength={120} placeholder={tab==="need"?"e.g. Grocery support":"e.g. Sealed food parcels"}/></label>
          <label>Details<textarea value={description} onChange={e=>setDescription(e.target.value)} required minLength={10} maxLength={1000} rows={4} placeholder="Share only the information needed. Do not include medical records or sensitive identity details."/></label>
          <label>City<input value={city} onChange={e=>setCity(e.target.value)} required maxLength={100}/></label>
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
    <p className="dashboard-safety">Resources are not visible to the community until reviewed. NEXORA is not an emergency service or a healthcare provider.</p>
  </main>;
}
