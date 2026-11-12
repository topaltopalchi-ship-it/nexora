"use client";

import "../auth-layout.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Need = { id:string; title:string; category:string; city:string; urgency:number; people_count:number; status:string };
type Match = { id:string; status:string; need_id:string; resource_id:string; requester_id:string; provider_id:string; human_review_required:boolean; resource?:{title:string;city:string;category:string} };

export default function ReviewPage(){
  const [needs,setNeeds]=useState<Need[]>([]);
  const [matches,setMatches]=useState<Match[]>([]);
  const [notice,setNotice]=useState("Loading review queue…");
  const [busy,setBusy]=useState<string|null>(null);

  async function load(){
    const s=createClient();
    const {data:{user}}=await s.auth.getUser();
    if(!user){ window.location.href="/auth"; return; }
    const {data:n,error}=await s.from("needs").select("id,title,category,city,urgency,people_count,status").in("status",["open","reviewing","matched"]).order("urgency",{ascending:false});
    if(error){setNotice(error.message);return;}
    const {data:m,error:me}=await s.from("matches").select("id,status,need_id,resource_id,requester_id,provider_id,human_review_required,resources(title,city,category)").order("created_at",{ascending:false});
    if(me){setNotice(me.message);return;}
    setNeeds((n??[]) as Need[]); setMatches((m??[]) as unknown as Match[]); setNotice("");
  }
  useEffect(()=>{void load()},[]);

  async function propose(needId:string){
    setBusy(needId); setNotice("");
    const s=createClient(); const {error}=await s.rpc("propose_matches_for_need",{p_need_id:needId,p_limit:5});
    if(error)setNotice(error.message); else {setNotice("Candidate matches created for human review."); await load();}
    setBusy(null);
  }
  async function review(id:string,decision:"accepted"|"rejected"){
    setBusy(id); setNotice("");
    const s=createClient(); const {error}=await s.rpc("review_match",{p_match_id:id,p_decision:decision});
    if(error)setNotice(error.message); else {setNotice(decision==="accepted"?"Match approved.":"Match rejected."); await load();}
    setBusy(null);
  }

  return <main className="dashboard-shell">
    <header className="dashboard-header"><Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link><Link href="/dashboard" className="auth-back">Back to workspace</Link></header>
    <section className="dashboard-welcome"><span className="kicker">HUMAN REVIEW</span><h1>Review queue.</h1><p>Only trusted reviewers should approve connections between people and resources.</p></section>
    <section className="dashboard-grid">
      <div className="dashboard-panel"><h2>Open needs</h2>{needs.length===0?<p className="empty-state">No needs are waiting in the queue.</p>:needs.map(n=><article className="activity-row" key={n.id}><div><strong>{n.title}</strong><small>{n.category} · {n.city} · urgency {n.urgency}/5 · {n.people_count} person(s)</small></div><button className="button button-secondary" disabled={busy===n.id} onClick={()=>void propose(n.id)}>{busy===n.id?"Working…":"Find candidates"}</button></article>)}</div>
      <div className="dashboard-panel activity-panel"><h2>Candidate matches</h2>{matches.length===0?<p className="empty-state">No candidate matches yet.</p>:matches.map(m=><article className="activity-row" key={m.id}><div><strong>{m.resource?.title ?? "Resource"}</strong><small>{m.resource?.category ?? "—"} · {m.resource?.city ?? "—"} · {m.status} · {m.human_review_required?"Human review":"Reviewed"}</small></div>{m.status==="proposed" && m.human_review_required?<div style={{display:"flex",gap:6}}><button className="button button-secondary" disabled={busy===m.id} onClick={()=>void review(m.id,"rejected")}>Reject</button><button className="button button-primary" disabled={busy===m.id} onClick={()=>void review(m.id,"accepted")}>Approve</button></div>:<span className="status-pill">{m.status}</span>}</article>)}</div>
    </section>
    {notice && <p className="form-message">{notice}</p>}
    <p className="dashboard-safety">Review actions are protected by the Supabase reviewer role. AI can rank candidates; it does not make the final human approval.</p>
  </main>;
}
