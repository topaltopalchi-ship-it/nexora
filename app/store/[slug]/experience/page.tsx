"use client";
import Link from "next/link";
import {use, useState} from "react";

const shelves=[
  {x:12,y:30,label:"لباس‌ها",product:"کت تک کلاسیک"},
  {x:43,y:23,label:"کالاهای ویژه",product:"پیراهن آذری"},
  {x:73,y:31,label:"محصولات جدید",product:"کیف چرمی"},
];

export default function Experience({params}:{params:Promise<{slug:string}>}) {
  const {slug}=use(params);
  const [mode,setMode]=useState<"walk"|"view">("walk");
  const [selected,setSelected]=useState<typeof shelves[number]|null>(null);
  const [x,setX]=useState(48);
  const [y,setY]=useState(65);
  const move=(dx:number,dy:number)=>{setX(v=>Math.max(6,Math.min(92,v+dx)));setY(v=>Math.max(48,Math.min(88,v+dy)))};
  return <main className="experience-shell" dir="rtl">
    <header className="experience-top"><Link href="/market">NEXORA</Link><span>تجربه مجازی · {slug}</span><Link href="/cart">سبد خرید</Link></header>
    <div className="experience-stage">
      <div className="wall">
        <div className="virtual-sign">NEXORA STORE</div>
        <div className="store-depth-line line-one"/><div className="store-depth-line line-two"/>
        {shelves.map(s=><button key={s.label} className="virtual-shelf" style={{left:`${s.x}%`,top:`${s.y}%`}} onClick={()=>{setSelected(s);setMode("view")}}>{s.label}<small>مشاهده کالا ↗</small></button>)}
        <div className="avatar" style={{left:`${x}%`,top:`${y}%`}}>●<span>شما</span></div>
      </div>
      <aside className="experience-panel">
        <span>01 / VIRTUAL WALK</span><h1>داخل فروشگاه حرکت کنید</h1>
        <p>با کنترل‌های پایین حرکت کنید و روی قفسه‌ها بزنید. این هسته‌ی تجربه بعداً می‌تواند با صحنه 3D یا اسکن 360 درجه فروشگاه واقعی جایگزین شود.</p>
        <div className="mode-buttons"><button className={mode==="walk"?"active":""} onClick={()=>setMode("walk")}>حرکت</button><button className={mode==="view"?"active":""} onClick={()=>setMode("view")}>نمایش کالا</button></div>
        <div className="movement-pad"><button onClick={()=>move(0,-5)}>↑</button><div><button onClick={()=>move(5,0)}>→</button><button onClick={()=>move(-5,0)}>←</button></div><button onClick={()=>move(0,5)}>↓</button></div>
        {selected&&<div className="selection">قفسه: <b>{selected.label}</b><span>{selected.product}</span><Link href={`/store/${slug}`}>دیدن جزئیات و محصولات ↗</Link></div>}
        <Link className="leave" href={`/store/${slug}`}>← خروج از فروشگاه</Link>
      </aside>
    </div>
  </main>;
}
