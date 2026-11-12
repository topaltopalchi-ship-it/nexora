"use client";

import "../auth-layout.css";
import "./network.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Resource = {
  id: string;
  title: string;
  category: string;
  public_summary: string;
  city: string;
  quantity: number;
  available_until: string | null;
  status: string;
};

const labels = {
  en: { title: "Verified network", intro: "Browse resources that have passed NEXORA's verification process.", all: "All", food: "Food", healthcare: "Healthcare", housing: "Housing", transport: "Transport", other: "Other", city: "Dubai", available: "Available", empty: "No verified resources match your filters yet.", back: "Back to workspace", request: "Request support", verified: "Verified", quantity: "Available quantity" },
  ar: { title: "شبكة موثوقة", intro: "تصفح الموارد التي اجتازت عملية التحقق في NEXORA.", all: "الكل", food: "الغذاء", healthcare: "الرعاية الصحية", housing: "السكن", transport: "النقل", other: "أخرى", city: "دبي", available: "متاح", empty: "لا توجد موارد موثوقة تطابق اختياراتك حالياً.", back: "العودة إلى مساحة العمل", request: "طلب الدعم", verified: "موثوق", quantity: "الكمية المتاحة" },
  fa: { title: "شبکه منابع تأییدشده", intro: "منابعی را ببینید که فرایند بررسی نکسورا را با موفقیت گذرانده‌اند.", all: "همه", food: "غذا", healthcare: "خدمات درمانی", housing: "اسکان", transport: "حمل‌ونقل", other: "سایر", city: "دبی", available: "موجود", empty: "هنوز منبع تأییدشده‌ای مطابق فیلترهای شما پیدا نشد.", back: "بازگشت به فضای کار", request: "درخواست حمایت", verified: "تأییدشده", quantity: "مقدار موجود" }
} as const;

export default function NetworkPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [category, setCategory] = useState("all");
  const [language, setLanguage] = useState<keyof typeof labels>("en");
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const t = labels[language];

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.replace("/auth"); return; }
      const { data, error } = await supabase
        .from("resources")
        .select("id,title,category,public_summary,city,quantity,available_until,status")
        .eq("status", "verified")
        .order("created_at", { ascending: false });
      if (error) setNotice(error.message);
      else setResources((data ?? []) as Resource[]);
    }
    void load();
  }, [router]);

  const filtered = useMemo(
    () => category === "all" ? resources : resources.filter(r => r.category === category),
    [resources, category]
  );

  return (
    <main className="dashboard-shell" dir={language === "en" ? "ltr" : "rtl"}>
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link>
        <div className="dashboard-user">
          <label className="language-select"><span>Language</span><select value={language} onChange={e => setLanguage(e.target.value as keyof typeof labels)}><option value="en">English</option><option value="ar">العربية</option><option value="fa">فارسی</option></select></label>
          <Link href="/dashboard">{t.back}</Link>
        </div>
      </header>

      <section className="dashboard-welcome">
        <span className="kicker">NEXORA NETWORK</span>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </section>

      <section className="network-panel dashboard-panel">
        <div className="network-toolbar">
          <div className="network-filters">
            {(["all","food","healthcare","housing","transport","other"] as const).map(key => (
              <button key={key} className={category === key ? "active" : ""} onClick={() => setCategory(key)}>{t[key]}</button>
            ))}
          </div>
          <span className="network-count">{filtered.length}</span>
        </div>

        {notice && <p className="form-message" role="status">{notice}</p>}
        {filtered.length === 0 ? <p className="empty-state">{t.empty}</p> : (
          <div className="resource-grid">
            {filtered.map(resource => (
              <article className="resource-card" key={resource.id}>
                <div className="resource-card-top">
                  <span className="status-pill">{t.verified}</span>
                  <span className="resource-city">{resource.city || t.city}</span>
                </div>
                <h2>{resource.title}</h2>
                <p>{resource.public_summary}</p>
                <div className="resource-meta">
                  <span>{t.quantity}: {resource.quantity}</span>
                  {resource.available_until && <span>{t.available}: {new Date(resource.available_until).toLocaleDateString()}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="network-actions">
        <Link className="button button-primary" href="/dashboard">{t.request}<span>↗</span></Link>
      </div>
    </main>
  );
}
