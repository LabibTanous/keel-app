import type { Metadata, Viewport } from "next"
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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Keel',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // enables env(safe-area-inset-*) across Dock + sheets on iOS
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EBE6DA' },
    { media: '(prefers-color-scheme: dark)', color: '#141915' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body className="min-h-dvh" style={{ background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}>
        <a href="#main" className="skip-link focus-ring">Skip to content</a>
        <ConvexClientProvider>
          <SessionProvider>
            <PlanProvider>
              <main id="main">{children}</main>
              {/* Global overlay sheets — triggered via keel:open-add / keel:open-assistant events */}
              <GlobalOverlays />
            </PlanProvider>
          </SessionProvider>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
