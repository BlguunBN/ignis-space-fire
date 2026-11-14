import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IGNIS | NASA Microgravity Fire Safety Intelligence",
  description:
    "Evidence-ranked, grounded spacecraft fire safety insights from decades of NASA microgravity combustion experiments (Saffire, BASS, FLEX, SAME, SPICE, SoFIE). NASA Space Apps Ulaanbaatar 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0b0d] text-[#f4f2ee] antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
