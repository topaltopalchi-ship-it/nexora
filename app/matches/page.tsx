"use client";

import "../auth-layout.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Match = {
  id:string; status:string; created_at:string;
  needs:{title:string;category:string;city:string}|null;
  resources:{title:string;city:string;public_summary:string}|null;
};
type Event = { match_id:string; event_type:string; note:string|null; created_at:string };

const nextEvent:Record<string,string|undefined>={
  accepted:"reserved",
  reserved:"collected",
  collected:"delivered",
  delivered:"received"
};

export default function MatchesPage(){
  const [matches,setMatches]=useState<Match[]>([]);
  const [events,setEvents]=useState<Record<string,Event[]>>({});
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState("");
  const router=useRouter();

  async function load(){
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){router.replace("/auth");return;}

    const {data,error}=await supabase.from("matches")
      .select("id,status,created_at,needs(title,category,city),resources(title,city,public_summary)")
      .order("created_at",{ascending:false});
    if(error){setNotice(error.message);return;}
    const rows=(data??[]) as Match[];
    setMatches(rows);
    if(rows.length){
      const {data:eventRows,error:eventError}=await supabase.from("outcome_events")
        .select("match_id,event_type,note,created_at")
        .in("match_id",rows.map(x=>x.id))
        .order("created_at",{ascending:true});
      if(eventError){setNotice(eventError.message);return;}
      const grouped:Record<string,Event[]>={};
      for(const e of (eventRows??[]) as Event[])(grouped[e.match_id]??=[]).push(e);
      setEvents(grouped);
    }else setEvents({});
  }

  useEffect(()=>{void load();},[]);

  async function record(matchId:string,eventType:string){
    setBusy(matchId);setNotice("");
    try{
      const supabase=createClient();
      const {error}=await supabase.rpc("record_outcome_event",{p_match:matchId,p_event_type:eventType,p_note:null});
      if(error)throw error;
      setNotice(eventType==="received"?"Match completed and need resolved.":`${eventType[0].toUpperCase()+eventType.slice(1)} recorded.`);
      await load();
    }catch(e){setNotice(e instanceof Error?e.message:"Lifecycle update failed.");}
    finally{setBusy("");}
  }

  async function cancel(matchId:string){
    setBusy(matchId);setNotice("");
    try{
      const supabase=createClient();
      const {error}=await supabase.rpc("record_outcome_event",{p_match:matchId,p_event_type:"cancelled",p_note:null});
      if(error)throw error;
      setNotice("Match cancelled and the reserved resource was released.");
      await load();
    }catch(e){setNotice(e instanceof Error?e.message:"Cancellation failed.");}
    finally{setBusy("");}
  }

  return <main className="dashboard-shell">
    <header className="dashboard-header"><Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link><div className="dashboard-user"><Link href="/dashboard">Workspace</Link><Link href="/network">Network</Link><Link href="/review">Review</Link></div></header>
    <section className="dashboard-welcome"><span className="kicker">MATCH LIFECYCLE</span><h1>My matches</h1><p>Track accepted connections from reservation through delivery and receipt.</p></section>
    {notice&&<p className="form-message" role="status">{notice}</p>}
    {matches.length===0?<section className="dashboard-panel"><p className="empty-state">No matches yet.</p></section>:<section className="match-list">
      {matches.map(m=>{
        const history=events[m.id]??[];
        const latest=history[history.length-1]?.event_type;
        const next=nextEvent[m.status==="accepted"&&latest?latest:m.status];
        return <article className="dashboard-panel match-card" key={m.id}>
          <div className="review-heading"><div><span className="status-pill">{m.status}</span><h2>{m.needs?.title??"Support need"}</h2></div><span>{m.needs?.city??"—"}</span></div>
          <p><strong>Resource:</strong> {m.resources?.title??"—"} · {m.resources?.city??"—"}</p>
          <p className="match-summary">{m.resources?.public_summary??""}</p>
          {history.length>0&&<div className="match-timeline">{history.map(e=><div key={e.match_id+e.created_at} className="timeline-item"><span>{e.event_type}</span><small>{new Date(e.created_at).toLocaleString()}</small></div>)}</div>}
          {m.status==="accepted"&&<div className="review-actions">
            {next&&<button disabled={busy===m.id} onClick={()=>record(m.id,next)}>Mark {next}</button>}
            <button disabled={busy===m.id} onClick={()=>cancel(m.id)}>Cancel</button>
          </div>}
          {m.status==="completed"&&<p className="dashboard-safety">Completed — receipt recorded and the need is resolved.</p>}
          {m.status==="cancelled"&&<p className="dashboard-safety">Cancelled — the match is closed and the resource is released.</p>}
        </article>;
      })}
    </section>}
  </main>;
}
