import Link from "next/link";
import { notFound } from "next/navigation";

const data: Record<string,{name:string;category:string;area:string;products:{name:string;price:string;description:string}[]}> = {
  "tabriz-fashion": {name:"Tabriz Fashion House",category:"Fashion",area:"Valiasr",products:[
    {name:"کت تک کلاسیک",price:"۳٬۸۵۰٬۰۰۰ تومان",description:"پارچه سبک، دوخت شهری و مناسب استفاده روزمره."},
    {name:"پیراهن آذری",price:"۱٬۹۵۰٬۰۰۰ تومان",description:"مدل الهام‌گرفته از پوشش محلی با طراحی امروزی."},
    {name:"کیف چرمی",price:"۲٬۴۰۰٬۰۰۰ تومان",description:"چرم طبیعی با طراحی مینیمال."},
  ]},
  "azar-grocery": {name:"Azar Supermarket",category:"Grocery",area:"Abolghasem Khan",products:[
    {name:"چای ممتاز",price:"۴۸۵٬۰۰۰ تومان",description:"بسته ۵۰۰ گرمی."},
    {name:"عسل کوهستان",price:"۷۹۰٬۰۰۰ تومان",description:"عسل طبیعی تولید منطقه."},
    {name:"خشکبار ویژه",price:"۶۲۰٬۰۰۰ تومان",description:"ترکیب آجیل تازه."},
  ]},
  "sahand-home": {name:"Sahand Home",category:"Home & Living",area:"El-Goli",products:[
    {name:"چراغ دکوراتیو",price:"۱٬۲۵۰٬۰۰۰ تومان",description:"نور گرم برای فضای نشیمن."},
    {name:"گلدان سرامیکی",price:"۷۸۰٬۰۰۰ تومان",description:"ساخت دست با لعاب مات."},
    {name:"میز کنار مبلی",price:"۳٬۹۰۰٬۰۰۰ تومان",description:"چوب طبیعی و طراحی ساده."},
  ]},
};

export default async function StorePage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const store=data[slug]; if(!store) notFound();
  return <main className="store-shell" dir="rtl">
    <header className="store-nav"><Link href="/market" className="back">← بازار مجازی</Link><div className="store-brand">NEXORA <small>VIRTUAL MARKET</small></div><Link href="/cart">سبد خرید</Link></header>
    <section className="store-hero"><div><span>{store.category} · {store.area} · تبریز</span><h1>{store.name}</h1><p>به فضای مجازی این فروشگاه وارد شوید، بخش‌ها را ببینید و کالاها را مستقیم انتخاب کنید.</p><Link className="enter-store" href={`/store/${slug}/experience`}>ورود به فضای فروشگاه ↗</Link></div><div className="store-preview"><div className="preview-sign">{store.name}</div><div className="preview-shelf"/><div className="preview-shelf second"/></div></section>
    <section className="product-section"><div className="store-kicker">محصولات فروشگاه</div><h2>انتخاب از قفسه</h2><div className="product-grid">{store.products.map((p,i)=><article className="product-card" key={p.name}><div className="product-image">{String(i+1).padStart(2,"0")}</div><span>{store.category}</span><h3>{p.name}</h3><p>{p.description}</p><strong>{p.price}</strong><Link className="product-add" href="/cart">افزودن به سبد ↗</Link></article>)}</div></section>
  </main>;
}
