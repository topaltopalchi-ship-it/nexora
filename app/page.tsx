import Link from "next/link";

export default function Home() {
  return (
    <main className="market-landing" dir="rtl">
      <header className="market-nav">
        <Link href="/market" className="market-logo"><span>N</span>NEXORA <small>VIRTUAL MARKET</small></Link>
        <nav><Link href="/market">بازار تبریز</Link><Link href="/market#categories">دسته‌بندی‌ها</Link><Link href="/cart">سبد خرید</Link></nav>
        <Link className="market-profile" href="/auth">ورود / ثبت‌نام</Link>
      </header>
      <section className="market-hero landing-hero">
        <div>
          <span className="market-kicker">TABRIZ · VIRTUAL COMMERCE</span>
          <h1>بازار واقعی را<br/><em>مجازی تجربه کنید.</em></h1>
          <p>در نکسورا وارد فروشگاه‌های واقعی تبریز شوید، در فضای مجازی حرکت کنید، کالاها را ببینید و خرید کنید.</p>
          <div className="market-actions"><Link href="/market" className="market-primary">ورود به بازار ↗</Link><Link href="/auth" className="market-secondary">ساخت پروفایل</Link></div>
        </div>
        <div className="market-scene landing-scene"><div className="scene-building"><span>NEXORA</span><b>VIRTUAL MARKET</b></div><div className="scene-floor"/><div className="scene-avatar">●</div><div className="scene-sign">TABRIZ</div></div>
      </section>
      <section className="landing-features"><div><span>01</span><h3>فروشگاه واقعی</h3><p>فروشگاه‌های شهر را به فضای دیجیتال قابل تجربه تبدیل می‌کنیم.</p></div><div><span>02</span><h3>حضور شخصی شما</h3><p>پروفایل و آواتار شخصی شما بخشی از تجربه خرید خواهد بود.</p></div><div><span>03</span><h3>خرید واقعی</h3><p>کالا را انتخاب می‌کنید و سفارش به فروشگاه واقعی می‌رسد.</p></div></section>
      <section className="market-identity landing-identity"><div><span className="market-kicker">THE NEXT STORE</span><h2>تبریز، اولین شهر بازار مجازی نکسورا.</h2><p>از فروشگاه‌های محلی تا برندها؛ هر فروشگاه یک ورودی مجازی خواهد داشت.</p><Link href="/market" className="market-primary">مشاهده فروشگاه‌ها ↗</Link></div><div className="identity-card"><div className="identity-head">YOUR PRESENCE</div><div className="identity-face">◉</div><span>WALK · LOOK · SHOP</span></div></section>
      <footer className="market-footer"><Link href="/market" className="market-logo"><span>N</span>NEXORA</Link><p>بازار مجازی تبریز</p><small>© 2026 NEXORA Virtual Market</small></footer>
    </main>
  );
}
