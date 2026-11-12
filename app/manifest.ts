import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEXORA Virtual Marketplace",
    short_name: "NEXORA",
    description: "بازار مجازی فروشگاه‌های واقعی تبریز",
    start_url: "/market",
    display: "standalone",
    background_color: "#07111f",
    theme_color: "#07111f",
    orientation: "portrait-primary",
    lang: "fa",
    dir: "rtl",
    categories: ["shopping", "games"],
  };
}
