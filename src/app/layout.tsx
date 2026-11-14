import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "IGNIS | NASA Microgravity Fire Safety Intelligence",
  description: "Explore source-linked summaries of NASA microgravity combustion investigations. NASA Space Apps Ulaanbaatar 2026.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
