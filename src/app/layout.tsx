import type { Metadata } from "next"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { PlanProvider } from "@/lib/store"
import { GlobalOverlays } from "@/components/keel/GlobalOverlays"
import { ConvexClientProvider } from "@/components/ConvexClientProvider"

export const metadata: Metadata = {
  title: "Keel — Your income, split before it lands",
  description: "The distribution layer for freelance income. When money comes in, Keel automatically sets aside tax, buffer, Zakat and goals — so what's left is truly yours to spend. Built for freelancers in the UAE & GCC.",
  openGraph: {
    title: "Keel",
    description: "Your income, split before it lands. Tax, buffer and goals set aside automatically — what's left is yours.",
    type: "website",
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/manifest.json',
  themeColor: '#1F4D3A',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Keel',
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
