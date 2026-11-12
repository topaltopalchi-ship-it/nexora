"use client";

import "../auth-layout.css";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Language = "en" | "fa" | "ar";
type Resource = {
  id: string;
  title: string;
  category: string;
  city: string;
  public_summary: string;
  quantity: number;
  created_at: string;
};

const labels = {
  en: {
    title: "Resource review", subtitle: "Review submitted resources before they become visible to the community.",
    back: "Back to dashboard", loading: "Checking reviewer access…", denied: "This account is not authorized to review resources.",
    empty: "There are no resources waiting for review.", pending: "Pending review", quantity: "Quantity",
    approve: "Approve resource", reject: "Reject resource", note: "Reviewer note (optional)",
    noteHint: "Add a short internal reason or guidance (max 1,000 characters).",
    approved: "Resource approved and published.", rejected: "Resource rejected.", failed: "The review could not be saved.",
    count: "Items awaiting review", language: "Language", signOut: "Sign out"
  },
  fa: {
    title: "بررسی منابع", subtitle: "منابع ارسالی را پیش از نمایش به جامعه بررسی کنید.",
    back: "بازگشت به پنل", loading: "در حال بررسی دسترسی بازبین…", denied: "این حساب اجازه بررسی منابع را ندارد.",
    empty: "در حال حاضر منبعی در انتظار بررسی نیست.", pending: "در انتظار بررسی", quantity: "تعداد",
    approve: "تأیید و انتشار", reject: "رد منبع", note: "یادداشت بازبین (اختیاری)",
    noteHint: "دلیل یا راهنمایی کوتاه و داخلی بنویسید (حداکثر ۱۰۰۰ نویسه).",
    approved: "منبع تأیید و منتشر شد.", rejected: "منبع رد شد.", failed: "ذخیره تصمیم بررسی ممکن نشد.",
    count: "منابع در انتظار بررسی", language: "زبان", signOut: "خروج"
  },
  ar: {
    title: "مراجعة الموارد", subtitle: "راجع الموارد المقدمة قبل إتاحتها للمجتمع.",
    back: "العودة إلى لوحة التحكم", loading: "جارٍ التحقق من صلاحية المراجع…", denied: "هذا الحساب غير مخول لمراجعة الموارد.",
    empty: "لا توجد موارد بانتظار المراجعة حالياً.", pending: "بانتظار المراجعة", quantity: "الكمية",
    approve: "الموافقة والنشر", reject: "رفض المورد", note: "ملاحظة المراجع (اختيارية)",
    noteHint: "أضف سبباً أو إرشاداً داخلياً مختصراً (بحد أقصى ١٠٠٠ حرف).",
    approved: "تمت الموافقة على المورد ونشره.", rejected: "تم رفض المورد.", failed: "تعذر حفظ قرار المراجعة.",
    count: "الموارد بانتظار المراجعة", language: "اللغة", signOut: "تسجيل الخروج"
  }
} as const;

export default function ReviewPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [resources, setResources] = useState<Resource[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const t = labels[language];

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { router.replace("/auth"); return; }

    const { data: profile } = await supabase.from("profiles").select("preferred_language").eq("id", user.id).maybeSingle();
    if (profile?.preferred_language === "fa" || profile?.preferred_language === "ar" || profile?.preferred_language === "en") {
      setLanguage(profile.preferred_language);
    }

    const { data: allowed, error: accessError } = await supabase.rpc("is_platform_reviewer");
    if (accessError) { setNotice(accessError.message); setReady(true); return; }
    setAuthorized(Boolean(allowed));
    if (!allowed) { setReady(true); return; }

    const { data, error } = await supabase.from("resources")
      .select("id,title,category,city,public_summary,quantity,created_at")
      .eq("status", "pending_review")
      .order("created_at", { ascending: true });
    if (error) setNotice(error.message);
    else setResources((data ?? []) as Resource[]);
    setReady(true);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function decide(resourceId: string, decision: "approved" | "rejected") {
    setBusyId(resourceId);
    setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("review_resource", {
        p_resource_id: resourceId,
        p_decision: decision,
        p_note: notes[resourceId]?.trim() || null
      });
      if (error) throw error;
      setResources(current => current.filter(item => item.id !== resourceId));
      setNotice(decision === "approved" ? t.approved : t.rejected);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t.failed);
    } finally {
      setBusyId("");
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (!ready) return <main className="dashboard-shell"><p>{t.loading}</p></main>;

  return <main className={"dashboard-shell review-shell" + (language !== "en" ? " rtl" : "")} dir={language === "en" ? "ltr" : "rtl"}>
    <header className="dashboard-header">
      <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link>
      <div className="dashboard-user">
        <label className="language-control"><span>{t.language}</span><select aria-label={t.language} value={language} onChange={e => setLanguage(e.target.value as Language)}><option value="en">English</option><option value="fa">فارسی</option><option value="ar">العربية</option></select></label>
        <Link href="/dashboard">{t.back}</Link>
        <button onClick={signOut}>{t.signOut}</button>
      </div>
    </header>
    <section className="dashboard-welcome">
      <span className="kicker">NEXORA TRUST & SAFETY</span>
      <h1>{t.title}</h1>
      <p>{t.subtitle}</p>
    </section>
    {!authorized ? <section className="dashboard-panel"><p className="form-message" role="status">{t.denied}</p></section> : <>
      <section className="dashboard-panel">
        <h2>{t.count} <span className="review-count">{resources.length}</span></h2>
        {resources.length === 0 ? <p className="empty-state">{t.empty}</p> : resources.map(item => <article className="review-item" key={item.id}>
          <div className="review-item-heading"><div><span className="status-pill">{t.pending}</span><h3>{item.title}</h3></div><span className="review-category">{item.category}</span></div>
          <p>{item.public_summary}</p>
          <div className="review-meta"><span>{item.city}</span><span>{t.quantity}: {item.quantity}</span><span>{new Date(item.created_at).toLocaleDateString(language === "fa" ? "fa-IR" : language === "ar" ? "ar" : "en")}</span></div>
          <label className="review-note">{t.note}<textarea rows={2} maxLength={1000} value={notes[item.id] ?? ""} onChange={e => setNotes(current => ({ ...current, [item.id]: e.target.value }))} placeholder={t.noteHint}/></label>
          <div className="review-actions">
            <button className="button button-primary" disabled={busyId !== ""} onClick={() => void decide(item.id, "approved")}>{busyId === item.id ? "…" : t.approve}</button>
            <button className="review-reject" disabled={busyId !== ""} onClick={() => void decide(item.id, "rejected")}>{t.reject}</button>
          </div>
        </article>)}
      </section>
    </>}
    {notice && <p className="form-message" role="status">{notice}</p>}
    <p className="dashboard-safety">Reviewer actions are permission-checked by the database and recorded in an audit log.</p>
  </main>;
}
