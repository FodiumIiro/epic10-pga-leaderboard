import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PGA Championship 2026 — Epic10",
  description:
    "Live-tulostaulukko 10 pelaajan sijoituskilpaan PGA Championship 2026 -turnauksessa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi" className="h-full antialiased">
      <body className="min-h-full bg-[#0A0F1E] text-zinc-100">{children}</body>
    </html>
  );
}
