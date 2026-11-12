import "../globals.css";
import "../marketplace.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEXORA Bazaar — Virtual Tabriz",
  description: "Explore Tabriz stores, talk to sellers and shop real products online.",
};

export default function MarketplaceLayout({children}:{children:React.ReactNode}){return children;}