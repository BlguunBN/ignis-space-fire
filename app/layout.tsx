import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IGNIS | NASA Microgravity Fire Safety Intelligence",
  description:
    "Explore source-linked summaries of NASA microgravity combustion investigations. NASA Space Apps Ulaanbaatar 2026.",
  other: {
    "darkreader-lock": "true",
    "color-scheme": "dark",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" content="true" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
