import Link from "next/link";

const stores = [
  { slug:"tabriz-fashion", name:"Tabriz Fashion House", category:"Fashion", area:"Valiasr", products:128, tag:"Featured" },
  { slug:"azar-grocery", name:"Azar Supermarket", category:"Grocery", area:"Abolghasem Khan", products:640, tag:"Open now" },
  { slug:"sahand-home", name:"Sahand Home", category:"Home & Living", area:"El-Goli", products:214, tag:"New" },
];

export default function MarketPage() {
  return (
    <main className="market-shell">
      <header className="market-nav">
        <Link href="/" className="market-logo"><span>N</span>NEXORA <small>VIRTUAL MARKET</small></Link>
        <nav><Link href="#stores">فروشگاه‌ها</Link><Link href="#categories">دسته‌بندی‌ها</Link><Link href="/cart">سبد خرید</Link></nav>
        <Link className="market-profile" href="/auth">ورود / ثبت‌نام</Link>
      </header>

      <section className="market-hero">
        <div>
          <span className="market-kicker">TABRIZ · IRAN · 3D COMMERCE</span>
          <h1>وارد بازار شوید،<br/><em>نه فقط یک وب‌سایت.</em></h1>
          <p>فروشگاه‌های واقعی تبریز را به‌صورت مجازی ببینید، داخلشان حرکت کنید، کالاها را بررسی کنید و خرید کنید.</p>
          <div className="market-actions"><Link href="#stores" className="market-primary">ورود به بازار ↗</Link><Link href="#how" className="market-secondary">چطور کار می‌کند؟</Link></div>
        </div>
        <div className="market-scene" aria-label="Virtual marketplace preview">
          <div className="scene-sky"/><div className="scene-building"><span>NEXORA</span><b>VIRTUAL MARKET</b></div>
          <div className="scene-floor"/><div className="scene-avatar">◉</div><div className="scene-sign">TABRIZ</div>
        </div>
      </section>

      <section id="categories" className="market-categories">
        {["Fashion","Grocery","Home & Living","Beauty","Electronics","Local Shops"].map((x,i)=><Link key={x} href="#stores"><span>0{i+1}</span>{x}<b>↗</b></Link>)}
      </section>

      <section id="stores" className="market-section">
        <div className="market-heading"><div><span className="market-kicker">01 — REAL STORES</span><h2>فروشگاه‌های تبریز</h2></div><p>نسخه اول بازار از فروشگاه‌های واقعی شهر شروع می‌شود و بعد به محله‌های بیشتری گسترش پیدا می‌کند.</p></div>
        <div className="store-grid">
          {stores.map(s=><article className="store-card" key={s.slug}>
            <div className="store-visual"><span>{s.tag}</span><strong>{s.name.slice(0,1)}</strong><small>{s.area} · Tabriz</small></div>
            <div className="store-body"><span>{s.category}</span><h3>{s.name}</h3><p>{s.products} محصول · تجربه مجازی فروشگاه</p><Link href={`/store/${s.slug}`}>ورود به فروشگاه <b>↗</b></Link></div>
          </article>)}
        </div>
      </section>

      <section id="how" className="market-flow">
        <span className="market-kicker">02 — YOUR JOURNEY</span><h2>از خیابان تا سبد خرید</h2>
        <div className="flow-grid"><div><i>01</i><h3>فروشگاه را انتخاب کنید</h3><p>فروشگاه‌های واقعی تبریز را بر اساس محله و دسته‌بندی پیدا کنید.</p></div><div><i>02</i><h3>وارد فضای مجازی شوید</h3><p>با آواتار خودتان وارد محیط فروشگاه شوید و بخش‌های مختلف را ببینید.</p></div><div><i>03</i><h3>کالا را بردارید</h3><p>روی کالا بزنید، جزئیات و قیمت را ببینید و آن را به سبد اضافه کنید.</p></div><div><i>04</i><h3>خرید را کامل کنید</h3><p>سفارش ثبت می‌شود و فروشگاه واقعی آن را برای شما آماده می‌کند.</p></div></div>
      </section>

      <section className="market-identity"><div><span className="market-kicker">03 — YOUR IDENTITY</span><h2>فروشگاه، چهره‌ی شما را می‌شناسد.</h2><p>در نسخه‌های بعدی می‌توانیم آواتار شخصی کاربر را بر اساس تصویر انتخابی خودش بسازیم تا حضور او در بازار مجازی شخصی‌تر و طبیعی‌تر شود.</p></div><div className="identity-card"><div className="identity-head">YOUR AVATAR</div><div className="identity-face">◉</div><span>PERSONAL PRESENCE</span></div></section>

      <footer className="market-footer"><Link href="/" className="market-logo"><span>N</span>NEXORA</Link><p>بازار مجازی تبریز · ساخته‌شده برای اتصال دنیای واقعی و دیجیتال</p><small>© 2026 NEXORA Virtual Market</small></footer>
    </main>
  );
}
