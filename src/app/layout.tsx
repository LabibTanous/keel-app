import type { Metadata } from "next"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { PlanProvider } from "@/lib/store"
import { GlobalOverlays } from "@/components/keel/GlobalOverlays"
import { ConvexClientProvider } from "@/components/ConvexClientProvider"

export const metadata: Metadata = {
  title: "Keel — Financial Stability for Irregular Income",
  description: "Budget smarter when your income changes every month. Income smoothing, tax reserve, runway tracker. Built for freelancers, gig workers, and creators worldwide.",
  openGraph: {
    title: "Keel",
    description: "Keep your finances on an even keel — even when income isn't.",
    type: "website",
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}>
        <ConvexClientProvider>
          <SessionProvider>
            <PlanProvider>
              {children}
              {/* Global overlay sheets — triggered via keel:open-add / keel:open-assistant events */}
              <GlobalOverlays />
            </PlanProvider>
          </SessionProvider>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
