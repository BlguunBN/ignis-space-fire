import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "../components/AuthProvider"

export const metadata: Metadata = {
  title: "FLARE | NASA Microgravity Fire Safety Intelligence",
  description: "Explore source-linked summaries of NASA microgravity combustion investigations. NASA Space Apps Ulaanbaatar 2026.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Dark Reader mutates the DOM before hydration and breaks React's tree.
            The app is already dark-themed, so opt out of the extension entirely. */}
        <meta name="darkreader-lock" />
      </head>
      <body suppressHydrationWarning><AuthProvider>{children}</AuthProvider></body>
    </html>
  )
}
