"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Store = { id:string; name:string; area:string; category:string; accent:string; description:string; products:string[] };

const stores:Store[] = [
  {id:"bazaar",name:"Tabriz Grand Bazaar",area:"Central Bazaar",category:"Fashion & Gifts",accent:"gold",description:"A virtual storefront inspired by Tabriz's historic bazaar district.",products:["Handmade carpet","Traditional leather bag","Azerbaijani textile"]},
  {id:"valiasr",name:"Valiasr Fashion House",area:"Valiasr",category:"Fashion",accent:"rose",description:"Modern clothing, shoes and accessories from local retailers.",products:["Women's coat","Men's sneakers","Leather handbag"]},
  {id:"elgoli",name:"El Goli Home",area:"El Goli",category:"Home & Living",accent:"sage",description:"Furniture, décor and everyday home products from nearby stores.",products:["Modern sofa","Table lamp","Decorative vase"]},
  {id:"laleh",name:"Laleh Park Gallery",area:"Laleh Park",category:"Beauty & Lifestyle",accent:"blue",description:"Beauty, personal care and lifestyle products in one virtual floor.",products:["Perfume","Skincare set","Travel accessories"]},
];

export default function MarketplacePage(){
  const [area,setArea]=useState("All Tabriz");
  const [category,setCategory]=useState("All");
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState<Store|null>(null);

  const visible=useMemo(()=>stores.filter(s=>(area==="All Tabriz"||s.area===area)&&(category==="All"||s.category===category)&&((s.name+" "+s.products.join(" ")).toLowerCase().includes(search.toLowerCase()))),[area,category,search]);

  return <main className="market-shell" dir="ltr">
    <header className="market-nav">
      <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link>
      <div className="market-title"><span className="market-dot"/>TABRIZ · VIRTUAL MARKET</div>
      <Link className="market-account" href="/auth">Sign in ↗</Link>
    </header>

    <section className="market-hero">
      <div>
        <span className="kicker">THE CITY IS YOUR MARKETPLACE</span>
        <h1>Walk through Tabriz.<br/><em>Shop the real stores.</em></h1>
        <p>Explore neighborhoods, enter participating stores, talk to real sellers by voice, and order real products for delivery.</p>
        <div className="market-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stores or products in Tabriz"/></div>
      </div>
      <div className="city-orbit" aria-label="Virtual Tabriz map illustration"><div className="city-ring ring-a"/><div className="city-ring ring-b"/><div className="city-core">TABRIZ</div><div className="city-pin pin-a">BAZAAR</div><div className="city-pin pin-b">VALIASR</div><div className="city-pin pin-c">EL GOLI</div><div className="city-pin pin-d">LALEH PARK</div></div>
    </section>

    <section className="market-controls">
      <div className="pills">{["All Tabriz","Central Bazaar","Valiasr","El Goli","Laleh Park"].map(x=><button key={x} className={area===x?"active":""} onClick={()=>setArea(x)}>{x}</button>)}</div>
      <select value={category} onChange={e=>setCategory(e.target.value)}><option>All</option><option>Fashion</option><option>Fashion & Gifts</option><option>Home & Living</option><option>Beauty & Lifestyle</option></select>
    </section>

    <section className="store-section"><div className="market-section-head"><div><span className="kicker">01 — EXPLORE</span><h2>Stores around the city</h2></div><span>{visible.length} virtual stores</span></div>
      <div className="store-grid">{visible.map(store=><article className={"store-card "+store.accent} key={store.id} onClick={()=>setSelected(store)}>
        <div className="store-scene"><div className="store-sign">{store.name}</div><div className="store-window"><span>LIVE STORE</span><b>◉</b></div><div className="store-floor"/></div>
        <div className="store-body"><div><span className="store-area">{store.area}</span><h3>{store.name}</h3><p>{store.description}</p></div><button onClick={e=>{e.stopPropagation();setSelected(store)}}>Enter ↗</button></div>
      </article>)}</div>
    </section>

    <section className="voice-banner"><div className="voice-icon">◉</div><div><span className="kicker">REAL HUMAN CONNECTION</span><h2>Need advice? Talk to the seller.</h2><p>Ask about size, color, availability or price before you buy. The seller answers from their store dashboard.</p></div><span className="voice-wave">•••</span></section>

    <section className="steps-mini"><div><span>01</span><b>Enter a store</b><p>Move through the virtual city and open a participating shop.</p></div><div><span>02</span><b>Choose & ask</b><p>Inspect products and start a voice conversation with the seller.</p></div><div><span>03</span><b>Order & deliver</b><p>Pay online and receive the real product at your address.</p></div></section>

    {selected && <div className="store-modal" role="dialog" aria-modal="true"><div className="store-modal-card"><button className="close" onClick={()=>setSelected(null)}>×</button><span className="kicker">{selected.area} · LIVE STORE</span><h2>{selected.name}</h2><p>{selected.description}</p><div className="product-list">{selected.products.map((p,i)=><div key={p}><div className="product-thumb">{String(i+1).padStart(2,"0")}</div><div><b>{p}</b><small>Available · Ask seller for details</small></div><button>Add to bag</button></div>)}</div><button className="voice-call">◉ Talk to seller</button></div></div>}
  </main>;
}
