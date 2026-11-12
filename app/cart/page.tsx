"use client";
import Link from "next/link";
export default function CartPage(){return <main className="cart-shell" dir="rtl"><header><Link href="/market">← بازار مجازی</Link><strong>NEXORA VIRTUAL MARKET</strong></header><section><span className="market-kicker">YOUR CART</span><h1>سبد خرید</h1><div className="empty-cart"><div>◌</div><h2>سبد شما هنوز خالی است</h2><p>یک فروشگاه را وارد شوید و کالاهای موردنظرتان را انتخاب کنید.</p><Link href="/market">ورود به بازار ↗</Link></div></section></main>}
