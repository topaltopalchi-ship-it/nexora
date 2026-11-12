import "./game.css";

"use client";

import { useEffect, useState } from "react";

type Device = "samsung" | "iphone" | "unsupported";

export default function GamePage() {
  const [device, setDevice] = useState<Device | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isSamsung = /SamsungBrowser|SM-[A-Z0-9-]+|SAMSUNG/i.test(ua);
    const isIPhone = /iPhone/i.test(ua);
    setDevice(isSamsung ? "samsung" : isIPhone ? "iphone" : "unsupported");
  }, []);

  if (device === null) return <main className="game-shell"><div className="game-loading">NEXORA</div></main>;

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
        <span className="device-badge">{device === "samsung" ? "SAMSUNG" : "IPHONE"}</span>
      </header>
      <section className="market-scene" aria-label="NEXORA virtual market">
        <div className="sky" />
        <div className="market-building">
          <div className="market-sign">NEXORA MARKET</div>
          <div className="store-row">
            <div className="store store-a"><b>FASHION</b><span>Try & shop</span></div>
            <div className="store store-b"><b>FOOD</b><span>Fresh today</span></div>
            <div className="store store-c"><b>HOME</b><span>Discover</span></div>
          </div>
          <div className="door" />
          <div className="avatar"><div className="avatar-head" /><div className="avatar-body" /></div>
        </div>
        <div className="touch-hint"><div className="joystick"><span /></div><div className="hint-text">Move around the market<br /><small>Tap a shop to enter</small></div></div>
        <div className="action-pad">
          <button onClick={() => setRunning(true)} aria-label="Interact">↗</button>
          <button onClick={() => setRunning(false)} aria-label="Stop">●</button>
        </div>
        <div className={running ? "toast visible" : "toast"}>Entering NEXORA Market…</div>
      </section>
      <nav className="game-nav"><button>⌂<span>Market</span></button><button>◉<span>Stores</span></button><button>◌<span>Profile</span></button></nav>
    </main>
  );
}
