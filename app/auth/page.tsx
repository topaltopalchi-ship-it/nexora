"use client";

import "../auth-layout.css";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";
type Language = "en" | "fa" | "ar";

const messages = {
  en: {
    kicker: "YOUR NEXORA ACCOUNT", signupTitle: "Join a more connected community.", loginTitle: "Welcome back.",
    signupSubtitle: "Create an account to request support or contribute resources.", loginSubtitle: "Sign in to manage your requests and resources.",
    create: "Create account", login: "Sign in", name: "Full name", purpose: "Account purpose",
    need: "I need support", provide: "I can offer support", organization: "Organization", volunteer: "Volunteer",
    language: "Preferred language", email: "Email address", password: "Password", passwordHint: "At least 8 characters",
    submitSignup: "Create my account", submitLogin: "Sign in", wait: "Please wait…",
    confirm: "Account created. Check your email to confirm your address, then sign in.",
    privacy: "Your account is protected by Supabase authentication. Never share your password with anyone.",
    back: "← Back to NEXORA", genericError: "Something went wrong. Please try again."
  },
  fa: {
    kicker: "حساب کاربری نکسورا", signupTitle: "به جامعه‌ای متصل‌تر بپیوندید.", loginTitle: "خوش برگشتید.",
    signupSubtitle: "برای درخواست حمایت یا ارائه منابع حساب بسازید.", loginSubtitle: "برای مدیریت درخواست‌ها و منابع خود وارد شوید.",
    create: "ایجاد حساب", login: "ورود", name: "نام و نام خانوادگی", purpose: "هدف از ساخت حساب",
    need: "به حمایت نیاز دارم", provide: "می‌توانم حمایت ارائه کنم", organization: "سازمان", volunteer: "داوطلب",
    language: "زبان ترجیحی", email: "نشانی ایمیل", password: "رمز عبور", passwordHint: "حداقل ۸ نویسه",
    submitSignup: "ایجاد حساب کاربری", submitLogin: "ورود به حساب", wait: "لطفاً صبر کنید…",
    confirm: "حساب ایجاد شد. برای تأیید نشانی ایمیل، صندوق ورودی خود را بررسی کنید و سپس وارد شوید.",
    privacy: "حساب شما با احراز هویت سوپابیس محافظت می‌شود. رمز عبور خود را در اختیار دیگران قرار ندهید.",
    back: "← بازگشت به نکسورا", genericError: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید."
  },
  ar: {
    kicker: "حساب NEXORA الخاص بك", signupTitle: "انضم إلى مجتمع أكثر ترابطاً.", loginTitle: "مرحباً بعودتك.",
    signupSubtitle: "أنشئ حساباً لطلب الدعم أو تقديم الموارد.", loginSubtitle: "سجّل الدخول لإدارة طلباتك ومواردك.",
    create: "إنشاء حساب", login: "تسجيل الدخول", name: "الاسم الكامل", purpose: "الغرض من الحساب",
    need: "أحتاج إلى الدعم", provide: "يمكنني تقديم الدعم", organization: "مؤسسة", volunteer: "متطوع",
    language: "اللغة المفضلة", email: "البريد الإلكتروني", password: "كلمة المرور", passwordHint: "٨ أحرف على الأقل",
    submitSignup: "إنشاء حسابي", submitLogin: "تسجيل الدخول", wait: "يرجى الانتظار…",
    confirm: "تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد العنوان ثم سجّل الدخول.",
    privacy: "حسابك محمي بواسطة مصادقة Supabase. لا تشارك كلمة المرور مع أي شخص.",
    back: "← العودة إلى NEXORA", genericError: "حدث خطأ. يرجى المحاولة مرة أخرى."
  }
} as const;

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [accountType, setAccountType] = useState("individual");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const t = messages[language];

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim(), preferred_language: language, account_type: accountType } }
        });
        if (error) throw error;
        if (data.session) router.push("/dashboard");
        else setMessage(t.confirm);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusy(false);
    }
  }

  return <main className={"auth-shell" + (language !== "en" ? " rtl" : "")} dir={language === "en" ? "ltr" : "rtl"}>
    <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link>
    <section className="auth-card">
      <label className="language-control"><span>{t.language}</span><select aria-label={t.language} value={language} onChange={e => setLanguage(e.target.value as Language)}><option value="en">English</option><option value="fa">فارسی</option><option value="ar">العربية</option></select></label>
      <span className="kicker">{t.kicker}</span>
      <h1>{mode === "signup" ? t.signupTitle : t.loginTitle}</h1>
      <p className="auth-subtitle">{mode === "signup" ? t.signupSubtitle : t.loginSubtitle}</p>
      <div className="auth-tabs">
        <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>{t.create}</button>
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>{t.login}</button>
      </div>
      <form onSubmit={submit} className="auth-form">
        {mode === "signup" && <>
          <label>{t.name}<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required minLength={2} maxLength={80} placeholder={t.name} /></label>
          <label>{t.purpose}<select value={accountType} onChange={e => setAccountType(e.target.value)}><option value="individual">{t.need}</option><option value="provider">{t.provide}</option><option value="organization">{t.organization}</option><option value="volunteer">{t.volunteer}</option></select></label>
        </>}
        <label>{t.email}<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required maxLength={254} placeholder="you@example.com" dir="ltr" /></label>
        <label>{t.password}<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} maxLength={128} placeholder={t.passwordHint} dir="ltr" /></label>
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? t.wait : mode === "signup" ? t.submitSignup : t.submitLogin} <span>↗</span></button>
      </form>
      {message && <p className="form-message" role="status">{message}</p>}
      <p className="auth-privacy">{t.privacy}</p>
    </section>
    <Link className="auth-back" href="/">{t.back}</Link>
  </main>;
}
