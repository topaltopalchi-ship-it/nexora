"use client";

import "../auth-layout.css";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Language = "en" | "fa" | "ar";
type Row = { id:string; title:string; category:string; status:string; city:string; created_at:string };

const copy = {
  en: {
    workspace:"YOUR WORKSPACE", welcome:"Welcome to NEXORA.", intro:"Manage your support requests and the resources you can share.",
    signOut:"Sign out", request:"Request support", offer:"Offer a resource", category:"Category",
    needTitle:"What support do you need?", resourceTitle:"What can you provide?", details:"Details", city:"City",
    needPlaceholder:"e.g. Grocery support", resourcePlaceholder:"e.g. Sealed food parcels",
    detailsPlaceholder:"Share only the information needed. Do not include medical records or sensitive identity details.",
    submitNeed:"Submit request", submitResource:"Submit for verification", submitting:"Submitting…",
    requestSent:"Your request has been submitted.", resourceSent:"Your resource is submitted and waiting for verification.",
    activity:"Your activity", requests:"Support requests", resources:"Your resources", noRequests:"No requests yet.",
    noResources:"No resources submitted yet.", safety:"Resources are not visible to the community until reviewed. NEXORA is not an emergency service or a healthcare provider.",
    language:"Language", languageSaved:"Language preference saved.", loadError:"Could not load your account. Please sign in again.",
    categories:{food:"Food",healthcare:"Healthcare",housing:"Housing",transport:"Transport",other:"Other"},
    statuses:{open:"Open",reviewing:"Reviewing",matched:"Matched",in_progress:"In progress",resolved:"Resolved",closed:"Closed",draft:"Draft",pending_review:"Pending review",verified:"Verified",reserved:"Reserved",fulfilled:"Fulfilled",expired:"Expired",suspended:"Suspended"}
  },
  fa: {
    workspace:"پنل کاربری", welcome:"به نکسورا خوش آمدید.", intro:"درخواست‌های حمایتی و منابعی را که می‌توانید ارائه دهید مدیریت کنید.",
    signOut:"خروج", request:"درخواست حمایت", offer:"ارائه منبع", category:"دسته‌بندی",
    needTitle:"به چه کمکی نیاز دارید؟", resourceTitle:"چه چیزی می‌توانید ارائه دهید؟", details:"توضیحات", city:"شهر",
    needPlaceholder:"مثلاً کمک برای تهیه مواد غذایی", resourcePlaceholder:"مثلاً بسته‌های غذایی پلمب‌شده",
    detailsPlaceholder:"فقط اطلاعات ضروری را بنویسید. مدارک پزشکی یا اطلاعات هویتی حساس را وارد نکنید.",
    submitNeed:"ثبت درخواست", submitResource:"ارسال برای بررسی", submitting:"در حال ارسال…",
    requestSent:"درخواست شما ثبت شد.", resourceSent:"منبع شما ثبت شد و در انتظار تأیید است.",
    activity:"فعالیت‌های شما", requests:"درخواست‌های حمایت", resources:"منابع شما", noRequests:"هنوز درخواستی ثبت نکرده‌اید.",
    noResources:"هنوز منبعی ثبت نکرده‌اید.", safety:"منابع تا پیش از بررسی و تأیید برای دیگران قابل مشاهده نیستند. نکسورا مرکز اورژانس یا ارائه‌دهنده خدمات درمانی نیست.",
    language:"زبان", languageSaved:"زبان انتخابی ذخیره شد.", loadError:"بارگذاری حساب کاربری ممکن نشد. لطفاً دوباره وارد شوید.",
    categories:{food:"غذا",healthcare:"درمان",housing:"مسکن",transport:"حمل‌ونقل",other:"سایر"},
    statuses:{open:"باز",reviewing:"در حال بررسی",matched:"تطبیق‌یافته",in_progress:"در حال انجام",resolved:"حل‌شده",closed:"بسته",draft:"پیش‌نویس",pending_review:"در انتظار بررسی",verified:"تأییدشده",reserved:"رزروشده",fulfilled:"انجام‌شده",expired:"منقضی",suspended:"تعلیق‌شده"}
  },
  ar: {
    workspace:"مساحة العمل", welcome:"مرحباً بك في نكسورا.", intro:"أدر طلبات الدعم والموارد التي يمكنك تقديمها.",
    signOut:"تسجيل الخروج", request:"طلب الدعم", offer:"تقديم مورد", category:"الفئة",
    needTitle:"ما الدعم الذي تحتاج إليه؟", resourceTitle:"ما الذي يمكنك تقديمه؟", details:"التفاصيل", city:"المدينة",
    needPlaceholder:"مثال: دعم لشراء المواد الغذائية", resourcePlaceholder:"مثال: طرود غذائية مغلقة",
    detailsPlaceholder:"شارك المعلومات الضرورية فقط. لا تضف سجلات طبية أو بيانات هوية حساسة.",
    submitNeed:"إرسال الطلب", submitResource:"إرسال للتحقق", submitting:"جارٍ الإرسال…",
    requestSent:"تم إرسال طلبك.", resourceSent:"تم إرسال المورد وهو بانتظار التحقق.",
    activity:"نشاطك", requests:"طلبات الدعم", resources:"مواردك", noRequests:"لا توجد طلبات بعد.",
    noResources:"لم يتم تقديم موارد بعد.", safety:"لن تظهر الموارد للمجتمع قبل مراجعتها. نكسورا ليست خدمة طوارئ أو جهة رعاية صحية.",
    language:"اللغة", languageSaved:"تم حفظ تفضيل اللغة.", loadError:"تعذر تحميل حسابك. يرجى تسجيل الدخول مجدداً.",
    categories:{food:"الغذاء",healthcare:"الرعاية الصحية",housing:"السكن",transport:"النقل",other:"أخرى"},
    statuses:{open:"مفتوح",reviewing:"قيد المراجعة",matched:"تمت المطابقة",in_progress:"قيد التنفيذ",resolved:"تم الحل",closed:"مغلق",draft:"مسودة",pending_review:"بانتظار المراجعة",verified:"تم التحقق",reserved:"محجوز",fulfilled:"تم التنفيذ",expired:"منتهي",suspended:"موقوف"}
  }
} as const;

export default function DashboardPage() {
  const [email,setEmail] = useState("");
  const [language,setLanguage] = useState<Language>("en");
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
  const t = copy[language];

  async function load() {
    const supabase = createClient();
    const {data:{user},error} = await supabase.auth.getUser();
    if(error || !user) { router.replace("/auth"); return; }
    setEmail(user.email ?? "");
    const [profile,n,r] = await Promise.all([
      supabase.from("profiles").select("preferred_language").eq("id",user.id).maybeSingle(),
      supabase.from("needs").select("id,title,category,status,city,created_at").order("created_at",{ascending:false}),
      supabase.from("resources").select("id,title,category,status,city,created_at").order("created_at",{ascending:false})
    ]);
    if(profile.data?.preferred_language === "fa" || profile.data?.preferred_language === "ar" || profile.data?.preferred_language === "en") setLanguage(profile.data.preferred_language);
    if(n.error) setNotice(n.error.message); else setNeeds((n.data ?? []) as Row[]);
    if(r.error) setNotice(r.error.message); else setResources((r.data ?? []) as Row[]);
    setReady(true);
  }
  useEffect(()=>{ void load(); },[]);

  async function changeLanguage(next: string) {
    if(next !== "en" && next !== "fa" && next !== "ar") return;
    setLanguage(next);
    setNotice("");
    const supabase = createClient();
    const {data:{user}} = await supabase.auth.getUser();
    if(!user) { router.replace("/auth"); return; }
    const {error} = await supabase.from("profiles").update({preferred_language:next}).eq("id",user.id);
    if(error) setNotice(error.message); else setNotice(copy[next].languageSaved);
  }

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setNotice("");
    try {
      const supabase = createClient();
      const {data:{user}} = await supabase.auth.getUser();
      if(!user) { router.replace("/auth"); return; }
      if(tab === "need") {
        const {error} = await supabase.from("needs").insert({requester_id:user.id,category,title:title.trim(),description:description.trim(),city:city.trim(),preferred_language:language,status:"open"});
        if(error) throw error;
      } else {
        const {error} = await supabase.from("resources").insert({provider_id:user.id,category,title:title.trim(),public_summary:description.trim(),city:city.trim(),quantity:1,status:"pending_review"});
        if(error) throw error;
      }
      setTitle(""); setDescription("");
      setNotice(tab === "need" ? t.requestSent : t.resourceSent);
      await load();
    } catch(err) { setNotice(err instanceof Error ? err.message : "Could not submit. Please try again."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    const supabase=createClient(); await supabase.auth.signOut(); router.replace("/");
  }

  if(!ready) return <main className="dashboard-shell"><p>{language === "fa" ? "در حال بارگذاری فضای امن شما…" : language === "ar" ? "جارٍ تحميل مساحة العمل الآمنة…" : "Loading your secure workspace…"}</p></main>;
  return <main className={"dashboard-shell" + (language === "fa" || language === "ar" ? " rtl" : "")} dir={language === "fa" || language === "ar" ? "rtl" : "ltr"}>
    <header className="dashboard-header">
      <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link>
      <div className="dashboard-user">
        <label className="language-control"><span>{t.language}</span><select aria-label={t.language} value={language} onChange={e=>void changeLanguage(e.target.value)}><option value="en">English</option><option value="fa">فارسی</option><option value="ar">العربية</option></select></label>
        <span>{email}</span><button onClick={signOut}>{t.signOut}</button>
      </div>
    </header>
    <section className="dashboard-welcome"><span className="kicker">{t.workspace}</span><h1>{t.welcome}</h1><p>{t.intro}</p></section>
    <section className="dashboard-grid">
      <div className="dashboard-panel">
        <div className="auth-tabs"><button className={tab==="need"?"active":""} onClick={()=>{setTab("need");setNotice("");}}>{t.request}</button><button className={tab==="resource"?"active":""} onClick={()=>{setTab("resource");setNotice("");}}>{t.offer}</button></div>
        <form className="auth-form" onSubmit={submit}>
          <label>{t.category}<select value={category} onChange={e=>setCategory(e.target.value)}><option value="food">{t.categories.food}</option><option value="healthcare">{t.categories.healthcare}</option><option value="housing">{t.categories.housing}</option><option value="transport">{t.categories.transport}</option><option value="other">{t.categories.other}</option></select></label>
          <label>{tab==="need"?t.needTitle:t.resourceTitle}<input value={title} onChange={e=>setTitle(e.target.value)} required minLength={4} maxLength={120} placeholder={tab==="need"?t.needPlaceholder:t.resourcePlaceholder}/></label>
          <label>{t.details}<textarea value={description} onChange={e=>setDescription(e.target.value)} required minLength={10} maxLength={1000} rows={4} placeholder={t.detailsPlaceholder}/></label>
          <label>{t.city}<input value={city} onChange={e=>setCity(e.target.value)} required maxLength={100}/></label>
          <button className="button button-primary auth-submit" disabled={busy}>{busy?t.submitting:tab==="need"?t.submitNeed:t.submitResource} <span>↗</span></button>
        </form>
        {notice && <p className="form-message" role="status">{notice}</p>}
      </div>
      <div className="dashboard-panel activity-panel">
        <h2>{t.activity}</h2><h3>{t.requests} <span>{needs.length}</span></h3>
        {needs.length===0?<p className="empty-state">{t.noRequests}</p>:needs.map(x=><article className="activity-row" key={x.id}><div><strong>{x.title}</strong><small>{t.categories[x.category as keyof typeof t.categories] ?? x.category} · {x.city}</small></div><span className="status-pill">{t.statuses[x.status as keyof typeof t.statuses] ?? x.status}</span></article>)}
        <h3 className="resources-heading">{t.resources} <span>{resources.length}</span></h3>
        {resources.length===0?<p className="empty-state">{t.noResources}</p>:resources.map(x=><article className="activity-row" key={x.id}><div><strong>{x.title}</strong><small>{t.categories[x.category as keyof typeof t.categories] ?? x.category} · {x.city}</small></div><span className="status-pill">{t.statuses[x.status as keyof typeof t.statuses] ?? x.status}</span></article>)}
      </div>
    </section>
    <p className="dashboard-safety">{t.safety}</p>
  </main>;
}
