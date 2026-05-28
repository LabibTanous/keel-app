import type { Metadata } from "next"
import "./globals.css"
import { SessionProvider } from "next-auth/react"

export const metadata: Metadata = {
  title: "Keel — Financial Stability for Irregular Income",
  description: "Budget smarter when your income changes every month. Income smoothing, tax reserve, runway tracker. Built for freelancers, gig workers, and creators worldwide.",
  openGraph: {
    title: "Keel",
    description: "Keep your finances on an even keel — even when income isn't.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
