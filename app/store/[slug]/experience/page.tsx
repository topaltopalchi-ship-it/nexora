"use client";
import Link from "next/link";
import {useState} from "react";

const shelves=[{x:16,y:31,label:"لباس‌ها"},{x:49,y:24,label:"کالاهای ویژه"},{x:75,y:34,label:"محصولات جدید"}];

export default function Experience({params}:{params:Promise<{slug:string}>}) {
  const [mode,setMode]=useState("walk");
  const [selected,setSelected]=useState<string|null>(null);
  const storeName= "Virtual Store";
  return <main className="experience-shell" dir="rtl">
    <header className="experience-top"><Link href="/market">NEXORA</Link><span>تجربه مجازی · {storeName}</span><Link href="/cart">سبد خرید</Link></header>
    <div className="experience-stage">
      <div className="wall"><div className="virtual-sign">NEXORA STORE</div>{shelves.map(s=><button key={s.label} className="virtual-shelf" style={{left:`${s.x}%`,top:`${s.y}%`}} onClick={()=>setSelected(s.label)}>{s.label}<small>مشاهده قفسه ↗</small></button>)}<div className="avatar">●<span>شما</span></div></div>
      <aside className="experience-panel"><span>01 / VIRTUAL WALK</span><h1>داخل فروشگاه حرکت کنید</h1><p>این نسخه اولیه، هسته تجربه را پیاده می‌کند. مرحله بعد می‌تواند با مدل سه‌بعدی یا عکس‌های 360 درجه فروشگاه واقعی جایگزین شود.</p><div className="mode-buttons"><button className={mode==="walk"?"active":""} onClick={()=>setMode("walk")}>حرکت</button><button className={mode==="view"?"active":""} onClick={()=>setMode("view")}>نمایش کالا</button></div>{selected&&<div className="selection">قفسه انتخاب‌شده: <b>{selected}</b><Link href="/cart">دیدن کالاها ↗</Link></div>}<Link className="leave" href="/market">← خروج از فروشگاه</Link></aside>
    </div>
  </main>;
}
