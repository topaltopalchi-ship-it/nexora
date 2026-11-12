import "./game.css";

"use client";

import { useEffect, useMemo, useState } from "react";

type Device = "samsung" | "iphone" | "unsupported";
type Tab = "market" | "stores" | "profile";

const shops = [
  { id: "fashion", name: "FASHION", subtitle: "Clothes & style", icon: "✦" },
  { id: "food", name: "FOOD", subtitle: "Local fresh food", icon: "⌁" },
  { id: "home", name: "HOME", subtitle: "Home & lifestyle", icon: "⌂" },
];

export default function GamePage() {
  const [device, setDevice] = useState<Device | null>(null);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<Tab>("market");
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const ua = navigator.userAgent;
    const isSamsung = /SamsungBrowser|SM-[A-Z0-9-]+|SAMSUNG/i.test(ua);
    const isIPhone = /iPhone/i.test(ua);
    setDevice(isSamsung ? "samsung" : isIPhone ? "iphone" : "unsupported");
  }, []);

  const deviceLabel = useMemo(
    () => (device === "samsung" ? "SAMSUNG" : "IPHONE"),
    [device],
  );

  const openShop = (shop: (typeof shops)[number]) => {
    setSelectedShop(shop.id);
    setNotice(`Opening ${shop.name}…`);
    window.setTimeout(() => setNotice(""), 1800);
  };

  if (device === null) {
    return <main className="game-shell"><div className="game-loading">NEXORA</div></main>;
  }

  if (device === "unsupported") {
    return (
      <main className="game-shell" dir="ltr">
        <div className="game-gate">
          <div className="game-logo">N</div>
          <span className="game-kicker">NEXORA VIRTUAL MARKET</span>
          <h1>Mobile only.</h1>
          <p>This game is currently designed for Samsung phones and iPhone.</p>
          <a href="/">Back to NEXORA</a>
        </div>
      </main>
    );
  }

  return (
    <main className="game-shell" dir="ltr">
      <header className="game-topbar">
        <a href="/" className="game-brand">NEXORA <span>MARKET</span></a>
        <span className="device-badge">{deviceLabel}</span>
      </header>

      <section className="market-scene" aria-label="NEXORA virtual market">
        <div className="sky" />

        {tab === "market" && (
          <>
            <div className="market-building">
              <div className="market-sign">NEXORA MARKET</div>
              <div className="store-row">
                {shops.map((shop) => (
                  <button
                    key={shop.id}
                    className={selectedShop === shop.id ? "store selected" : "store"}
                    onClick={() => openShop(shop)}
                    aria-label={`Open ${shop.name} store`}
                  >
                    <span className="store-icon">{shop.icon}</span>
                    <b>{shop.name}</b>
                    <span>{shop.subtitle}</span>
                    <small>ENTER →</small>
                  </button>
                ))}
              </div>
              <div className="door" />
              <div className="avatar"><div className="avatar-head" /><div className="avatar-body" /></div>
            </div>

            <div className="touch-hint">
              <div className="joystick"><span /></div>
              <div className="hint-text">Move around the market<br /><small>Tap a shop to enter</small></div>
            </div>

            <div className="action-pad">
              <button onClick={() => setRunning(true)} aria-label="Move">↗</button>
              <button onClick={() => setRunning(false)} aria-label="Stop">●</button>
            </div>
          </>
        )}

        {tab === "stores" && (
          <div className="panel-screen">
            <span className="panel-kicker">NEXORA STORES</span>
            <h1>Explore Tabriz.</h1>
            <p>Real local shops will appear here as verified NEXORA storefronts.</p>
            <div className="store-list">
              {shops.map((shop) => (
                <button key={shop.id} className="store-list-item" onClick={() => openShop(shop)}>
                  <span className="store-icon">{shop.icon}</span>
                  <span><b>{shop.name}</b><small>{shop.subtitle}</small></span>
                  <strong>›</strong>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div className="panel-screen profile-screen">
            <div className="profile-avatar"><div className="avatar-head" /><div className="avatar-body" /></div>
            <span className="panel-kicker">YOUR NEXORA ID</span>
            <h1>My avatar</h1>
            <p>Your real appearance will become the base for your virtual-market avatar.</p>
            <button className="primary-action" onClick={() => setNotice("Avatar customization is next.")}>CUSTOMIZE AVATAR</button>
          </div>
        )}

        <div className={notice ? "toast visible" : "toast"}>{notice}</div>
        {running && tab === "market" && <div className="movement-pill">MOVING</div>}
      </section>

      <nav className="game-nav">
        <button className={tab === "market" ? "active" : ""} onClick={() => setTab("market")}>⌂<span>Market</span></button>
        <button className={tab === "stores" ? "active" : ""} onClick={() => setTab("stores")}>◉<span>Stores</span></button>
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>◌<span>Profile</span></button>
      </nav>
    </main>
  );
}
