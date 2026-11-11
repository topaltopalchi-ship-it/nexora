"use client";

import { useMemo, useState } from "react";

type Lang = "en" | "ar" | "fa";
const copy = {
  en: {
    eyebrow: "A little help. A real connection.",
    title: "Good things should reach the people who need them.",
    intro: "NEXORA connects people seeking support with verified local organizations and resources — with care, dignity, and human oversight.",
    request: "I need support",
    provide: "I can offer support",
    explore: "Explore the network",
    trusted: "Built around trust",
    trustedText: "Every provider and resource goes through a review process before it can be presented as verified.",
    categories: "Ways we connect",
    food: "Food rescue",
    foodText: "Help good food reach people instead of going to waste.",
    health: "Healthcare access",
    healthText: "Find pathways to verified healthcare providers and services.",
    housing: "Safe support & housing",
    housingText: "Connect with vetted organizations offering practical support.",
    how: "How NEXORA works",
    step1: "Share a need or resource",
    step1Text: "Tell us what support is needed or what you can responsibly provide.",
    step2: "People and resources are reviewed",
    step2Text: "Providers are checked before their resources are listed as verified.",
    step3: "A human-guided connection",
    step3Text: "Relevant options are surfaced, with human review for sensitive placements.",
    pilot: "Starting in Dubai",
    pilotText: "NEXORA is being prepared for a Dubai pilot, with English, Arabic, and Persian support.",
    note: "NEXORA is a coordination platform, not an emergency service or medical provider. In an emergency, contact local emergency services.",
    footer: "A more connected way to care.",
    soon: "The secure request and provider portal is coming next.",
    language: "Language",
  },
  ar: {
    eyebrow: "مساعدة بسيطة. تواصل حقيقي.",
    title: "يجب أن تصل الأشياء الجيدة إلى من يحتاج إليها.",
    intro: "تربط NEXORA الأشخاص الباحثين عن الدعم بالمؤسسات والموارد المحلية الموثوقة، مع الحفاظ على الكرامة والإشراف البشري.",
    request: "أحتاج إلى دعم",
    provide: "يمكنني تقديم الدعم",
    explore: "استكشف الشبكة",
    trusted: "الثقة أولاً",
    trustedText: "تخضع الجهات والموارد للمراجعة قبل عرضها على أنها موثوقة.",
    categories: "طرق التواصل",
    food: "إنقاذ الطعام",
    foodText: "مساعدة الطعام الفائض على الوصول إلى الناس بدلاً من هدره.",
    health: "الوصول إلى الرعاية الصحية",
    healthText: "التعرّف على مقدمي الرعاية الصحية والخدمات المعتمدين.",
    housing: "الدعم الآمن والسكن",
    housingText: "التواصل مع مؤسسات موثوقة تقدم المساعدة العملية.",
    how: "كيف تعمل NEXORA",
    step1: "شارك احتياجاً أو مورداً",
    step1Text: "أخبرنا بالدعم المطلوب أو بما يمكنك تقديمه بمسؤولية.",
    step2: "مراجعة الأشخاص والموارد",
    step2Text: "يتم التحقق من الجهات قبل إدراج مواردها على أنها موثوقة.",
    step3: "تواصل بإشراف بشري",
    step3Text: "تُعرض الخيارات المناسبة مع مراجعة بشرية للحالات الحساسة.",
    pilot: "البداية في دبي",
    pilotText: "يجري إعداد NEXORA لإطلاق تجريبي في دبي بالإنجليزية والعربية والفارسية.",
    note: "NEXORA منصة تنسيق وليست خدمة طوارئ أو جهة طبية. في حالات الطوارئ، اتصل بخدمات الطوارئ المحلية.",
    footer: "رعاية أفضل عبر التواصل.",
    soon: "بوابة الطلبات ومقدمي الخدمات الآمنة قيد التطوير.",
    language: "اللغة",
  },
  fa: {
    eyebrow: "کمکی کوچک؛ ارتباطی واقعی.",
    title: "امکانات خوب باید به دست کسانی برسند که به آن‌ها نیاز دارند.",
    intro: "نکسورا افراد نیازمند حمایت را به منابع و سازمان‌های محلیِ تأییدشده متصل می‌کند؛ با حفظ کرامت انسانی و نظارت افراد متخصص.",
    request: "به حمایت نیاز دارم",
    provide: "می‌توانم حمایت کنم",
    explore: "مشاهده شبکه",
    trusted: "اعتماد در اولویت است",
    trustedText: "ارائه‌دهندگان و منابع پیش از معرفی به‌عنوان تأییدشده، بررسی می‌شوند.",
    categories: "راه‌های ارتباط",
    food: "نجات غذا",
    foodText: "کمک می‌کنیم غذای مازاد به دست افراد برسد، نه اینکه دور ریخته شود.",
    health: "دسترسی به خدمات درمانی",
    healthText: "معرفی مسیرهای دسترسی به مراکز و ارائه‌دهندگان درمانی معتبر.",
    housing: "حمایت امن و اسکان",
    housingText: "ارتباط با سازمان‌های معتبر برای دریافت حمایت و اسکان.",
    how: "نکسورا چگونه کار می‌کند؟",
    step1: "نیاز یا منبع را ثبت کنید",
    step1Text: "نیاز خود یا حمایتی را که می‌توانید مسئولانه ارائه دهید، بیان کنید.",
    step2: "بررسی افراد و منابع",
    step2Text: "پیش از معرفی منابع به‌عنوان معتبر، ارائه‌دهندگان بررسی می‌شوند.",
    step3: "ارتباط با راهنمایی انسانی",
    step3Text: "گزینه‌های مناسب پیشنهاد می‌شوند و موارد حساس با نظارت انسانی پیش می‌روند.",
    pilot: "شروع از دبی",
    pilotText: "نکسورا برای اجرای آزمایشی در دبی و با پشتیبانی فارسی، عربی و انگلیسی آماده می‌شود.",
    note: "نکسورا سامانه هماهنگی است، نه مرکز فوریت‌های پزشکی یا ارائه‌دهنده درمان. در شرایط اضطراری با خدمات اورژانس محلی تماس بگیرید.",
    footer: "مراقبت بهتر با ارتباط بیشتر.",
    soon: "درگاه امن ثبت درخواست و ارائه منابع در مرحله بعد توسعه داده می‌شود.",
    language: "زبان",
  },
} as const;

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const t = useMemo(() => copy[lang], [lang]);
  const rtl = lang !== "en";

  return (
    <main dir={rtl ? "rtl" : "ltr"} className={rtl ? "rtl" : ""}>
      <header className="topbar">
        <a className="brand" href="#" aria-label="NEXORA home"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></a>
        <nav className="nav-links"><a href="#connect">{t.categories}</a><a href="#how">{t.how}</a><a href="#about">{t.pilot}</a></nav>
        <label className="language-select"><span>{t.language}</span><select value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label={t.language}><option value="en">English</option><option value="ar">العربية</option><option value="fa">فارسی</option></select></label>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse" />{t.eyebrow}</div>
          <h1>{t.title}</h1>
          <p className="hero-intro">{t.intro}</p>
          <div className="hero-actions"><a className="button button-primary" href="/auth">{t.request}<span>↗</span></a><a className="button button-secondary" href="/auth">{t.provide}</a></div>
          <div className="hero-footnote"><span className="shield">✳</span>{t.trusted}</div>
        </div>
        <div className="hero-art" aria-label="Abstract illustration of people and resources connecting">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="orb orb-main"><span>n</span></div>
          <div className="orb orb-food">✳</div><div className="orb orb-care">＋</div><div className="orb orb-home">⌂</div>
          <div className="orbit-caption caption-top">PEOPLE</div><div className="orbit-caption caption-bottom">RESOURCES</div>
          <div className="spark spark-one">✦</div><div className="spark spark-two">✧</div>
        </div>
        <div className="hero-bottom"><span>01 / 03</span><span className="hero-line" /><span>DUBAI · UAE</span></div>
      </section>

      <section className="trust-strip"><div className="trust-icon">✳</div><div><h2>{t.trusted}</h2><p>{t.trustedText}</p></div><span className="trust-tag">HUMAN-LED · AI-ASSISTED</span></section>

      <section className="section" id="connect">
        <div className="section-heading"><div><span className="kicker">01 — THE NETWORK</span><h2>{t.categories}</h2></div><p>{t.soon}</p></div>
        <div className="service-grid">
          <article className="service-card food-card"><div className="service-top"><span className="service-number">01</span><span className="service-symbol">✳</span></div><h3>{t.food}</h3><p>{t.foodText}</p><span className="card-arrow">↗</span></article>
          <article className="service-card health-card"><div className="service-top"><span className="service-number">02</span><span className="service-symbol">＋</span></div><h3>{t.health}</h3><p>{t.healthText}</p><span className="card-arrow">↗</span></article>
          <article className="service-card home-card"><div className="service-top"><span className="service-number">03</span><span className="service-symbol">⌂</span></div><h3>{t.housing}</h3><p>{t.housingText}</p><span className="card-arrow">↗</span></article>
        </div>
      </section>

      <section className="how-section" id="how"><div className="section-heading"><div><span className="kicker">02 — THE PROCESS</span><h2>{t.how}</h2></div></div><div className="steps">
        <article><span className="step-no">01</span><h3>{t.step1}</h3><p>{t.step1Text}</p></article>
        <article><span className="step-no">02</span><h3>{t.step2}</h3><p>{t.step2Text}</p></article>
        <article><span className="step-no">03</span><h3>{t.step3}</h3><p>{t.step3Text}</p></article>
      </div></section>

      <section className="pilot-section" id="about"><div className="pilot-mark">N.</div><div><span className="kicker">03 — FIRST STEPS</span><h2>{t.pilot}</h2><p>{t.pilotText}</p></div><div className="pilot-stamp">EN<br/>AR<br/>FA</div></section>
      <footer><a className="brand footer-brand" href="#"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></a><p>{t.footer}</p><small>{t.note}</small><div className="copyright">© 2026 NEXORA AI</div></footer>
    </main>
  );
}
