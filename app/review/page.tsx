"use client";

import "../auth-layout.css";
import "./review.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Resource = { id:string; title:string; category:string; city:string; public_summary:string; organization_id:string|null; status:string };
type Need = { id:string; title:string; category:string; city:string; urgency:number; status:string };
type Match = {
  id:string; status:string; human_review_required:boolean; created_at:string;
  needs:{title:string;category:string;city:string;urgency:number}|null;
  resources:{title:string;category:string;city:string;public_summary:string}|null;
};

export default function ReviewPage() {
  const [resources,setResources]=useState<Resource[]>([]);
  const [needs,setNeeds]=useState<Need[]>([]);
  const [matches,setMatches]=useState<Match[]>([]);
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState("");
  const router=useRouter();

  async function load(){
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){router.replace("/auth");return;}
    const [r,n,m]=await Promise.all([
      supabase.from("resources").select("id,title,category,city,public_summary,organization_id,status").in("status",["pending_review","draft"]).order("created_at",{ascending:false}),
      supabase.from("needs").select("id,title,category,city,urgency,status").in("status",["open","reviewing"]).order("urgency",{ascending:false}).order("created_at",{ascending:true}),
      supabase.from("matches").select("id,status,human_review_required,created_at,needs(title,category,city,urgency),resources(title,category,city,public_summary)").eq("status","proposed").eq("human_review_required",true).order("created_at",{ascending:false})
    ]);
    if(r.error || n.error || m.error){setNotice(r.error?.message ?? n.error?.message ?? m.error?.message ?? "Review queue unavailable.");return;}
    setResources((r.data??[]) as Resource[]);
    setNeeds((n.data??[]) as Need[]);
    setMatches((m.data??[]) as Match[]);
  }

  useEffect(()=>{void load();},[]);

  async function review(id:string,decision:"verify"|"reject"){
    setBusy(id);setNotice("");
    try{
      const supabase=createClient();
      const {error}=await supabase.rpc("review_resource",{p_resource:id,p_decision:decision});
      if(error) throw error;
      setNotice(decision==="verify"?"Resource verified and published.":"Resource rejected and suspended.");
      await load();
    }catch(e){setNotice(e instanceof Error?e.message:"Review failed.");}
    finally{setBusy("");}
  }

  async function propose(id:string){
    setBusy(id);setNotice("");
    try{
      const supabase=createClient();
      const {data,error}=await supabase.rpc("propose_matches_for_need",{p_need:id});
      if(error) throw error;
      setNotice(data ? `${data} match proposal(s) created for human review.` : "No suitable verified resources found.");
      await load();
    }catch(e){setNotice(e instanceof Error?e.message:"Matching failed.");}
    finally{setBusy("");}
  }

  async function reviewMatch(id:string,decision:"accept"|"reject"){
    setBusy(id);setNotice("");
    try{
      const supabase=createClient();
      const {error}=await supabase.rpc("review_match",{p_match:id,p_decision:decision});
      if(error) throw error;
      setNotice(decision==="accept"?"Match accepted. Resource reserved and need marked matched.":"Match rejected; the need remains available for review.");
      await load();
    }catch(e){setNotice(e instanceof Error?e.message:"Match review failed.");}
    finally{setBusy("");}
  }

  return <main className="dashboard-shell">
    <header className="dashboard-header"><Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link><div className="dashboard-user"><Link href="/dashboard">Workspace</Link><Link href="/network">Network</Link><Link href="/matches">Matches</Link></div></header>
    <section className="dashboard-welcome"><span className="kicker">TRUST & SAFETY</span><h1>Human review queue</h1><p>Verify resources before publication, propose candidates, and approve matches without bypassing human review.</p></section>
    {notice&&<p className="form-message" role="status">{notice}</p>}
    <section className="review-grid">
      <div className="dashboard-panel"><div className="review-heading"><h2>Resources awaiting review</h2><span>{resources.length}</span></div>
        {resources.length===0?<p className="empty-state">No resources are waiting for review.</p>:resources.map(r=><article className="review-card" key={r.id}><div><span className="status-pill">{r.status}</span><h3>{r.title}</h3><p>{r.category} · {r.city}</p><small>{r.public_summary}</small></div><div className="review-actions"><button disabled={busy===r.id} onClick={()=>review(r.id,"verify")}>Verify</button><button disabled={busy===r.id} onClick={()=>review(r.id,"reject")}>Reject</button></div></article>)}
      </div>
      <div className="dashboard-panel"><div className="review-heading"><h2>Open support needs</h2><span>{needs.length}</span></div>
        {needs.length===0?<p className="empty-state">No open needs are waiting for matching.</p>:needs.map(n=><article className="review-card" key={n.id}><div><span className="status-pill">Urgency {n.urgency}/5</span><h3>{n.title}</h3><p>{n.category} · {n.city}</p></div><button disabled={busy===n.id} onClick={()=>propose(n.id)}>Propose matches</button></article>)}
      </div>
    </section>
    <section className="dashboard-panel review-matches-panel">
      <div className="review-heading"><h2>Match proposals awaiting approval</h2><span>{matches.length}</span></div>
      {matches.length===0?<p className="empty-state">No match proposals are waiting for approval.</p>:matches.map(m=><article className="review-card" key={m.id}>
        <div>
          <span className="status-pill">Human review</span>
          <h3>{m.needs?.title ?? "Support need"}</h3>
          <p>{m.needs?.category ?? "—"} · {m.needs?.city ?? "—"} · urgency {m.needs?.urgency ?? "—"}/5</p>
          <small><strong>Resource:</strong> {m.resources?.title ?? "—"} — {m.resources?.public_summary ?? ""}</small>
        </div>
        <div className="review-actions"><button disabled={busy===m.id} onClick={()=>reviewMatch(m.id,"accept")}>Accept</button><button disabled={busy===m.id} onClick={()=>reviewMatch(m.id,"reject")}>Reject</button></div>
      </article>)}
    </section>
    <p className="dashboard-safety">AI or deterministic matching only proposes candidates. A human reviewer controls acceptance, and participants record the delivery lifecycle.</p>
  </main>;
}
