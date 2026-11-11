import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXORA AI — Human needs, real-world support",
  description: "A multilingual network connecting verified human needs with trusted local resources.",
  applicationName: "NEXORA AI",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
