import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEXORA Virtual Market",
    short_name: "NEXORA",
    description: "NEXORA mobile virtual market",
    start_url: "/game",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d1117",
    theme_color: "#0d1117",
    icons: [{ src: "/icon", sizes: "any", type: "image/svg+xml" }],
  };
}
