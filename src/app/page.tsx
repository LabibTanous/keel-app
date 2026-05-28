"use client"

import { signIn } from "next-auth/react"
import Link from "next/link"
import { TrendingUp, Shield, Calculator, Zap, Globe, ArrowRight, CheckCircle2 } from "lucide-react"

const PAIN_POINTS = [
  "Made $9K last month, $600 this month — how do I budget?",
  "Owe $8,000 in taxes I never saved for",
  "Can't answer 'can I afford this?' when income changes",
  "Every budgeting app assumes I get a salary",
]

const REGIONS = ["🇺🇸 US", "🇦🇪 UAE", "🇸🇦 KSA", "🇬🇧 UK", "🇨🇦 Canada", "🇦🇺 Australia", "🇩🇪 Germany", "🇮🇳 India", "🇵🇭 Philippines", "+ more"]

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Income Smoothing",
    desc: "Rolling 6-month average tells you your real monthly budget — not what you earned this month.",
    color: "bg-keel-50 text-keel-600",
  },
  {
    icon: Shield,
    title: "Tax / Zakat Jar",
    desc: "Every payment logged automatically reserves the right % for taxes, Zakat, or VAT based on your region.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Calculator,
    title: "Runway Meter",
    desc: "One number: how many months you can survive if all income stopped today. Always visible.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Zap,
    title: "Can I Afford This?",
    desc: "Type any amount — get an instant verdict with how it impacts your runway.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Globe,
    title: "Global Tax Profiles",
    desc: "Built-in profiles for US, UK, UAE, Saudi, Canada, Australia, Germany, India, Philippines + more.",
    color: "bg-rose-50 text-rose-600",
  },
]

const MODES = [
  {
    mode: "LEAN",
    emoji: "⚠️",
    color: "border-red-200 bg-red-50",
    badge: "bg-red-100 text-red-700",
    desc: "You're below average. Keel switches to strict mode — shows tighter limits.",
  },
  {
    mode: "NORMAL",
    emoji: "✅",
    color: "border-keel-200 bg-keel-50",
    badge: "bg-keel-100 text-keel-700",
    desc: "On track. Budget is based on your rolling average.",
  },
  {
    mode: "FLUSH",
    emoji: "💰",
    color: "border-blue-200 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    desc: "Above average month. Keel suggests saving the surplus — not spending it.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-keel-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">K</span>
            </div>
            <span className="font-extrabold text-xl text-gray-900">Keel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:block">Free to start · No credit card</span>
            <button
              onClick={() => signIn("github", { callbackUrl: "/onboarding" })}
              className="bg-keel-600 hover:bg-keel-700 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors"
            >
              Get started free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-keel-700 bg-keel-50 border border-keel-200 px-3 py-1.5 rounded-full mb-8">
          <Globe className="w-3.5 h-3.5" /> Works in 9+ countries including UAE, Saudi, US, UK
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
          Finally, a budget app<br />
          <span className="text-keel-500">for unpredictable income</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          Freelancers, gig workers, and creators can&apos;t use normal budgeting apps.
          Keel is built from the ground up for income that changes every month.
        </p>
        <button
          onClick={() => signIn("github", { callbackUrl: "/onboarding" })}
          className="inline-flex items-center gap-2 bg-keel-600 hover:bg-keel-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-keel-100 mb-4"
        >
          Start for free <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-sm text-gray-400">No bank connection needed. Setup takes 2 minutes.</p>
      </section>

      {/* Pain Points */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
          Sound familiar?
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {PAIN_POINTS.map((p) => (
            <div key={p} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-lg mt-0.5">😩</span>
              <p className="text-sm text-gray-700 italic">&ldquo;{p}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* Income Mode Visual */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-3">Your money has three modes</h2>
          <p className="text-gray-500 text-center mb-10">Keel detects which mode you're in and adjusts automatically.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {MODES.map((m) => (
              <div key={m.mode} className={`rounded-xl border-2 p-6 ${m.color}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{m.emoji}</span>
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${m.badge}`}>{m.mode}</span>
                </div>
                <p className="text-sm text-gray-600">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-12">Everything you need. Nothing you don&apos;t.</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global */}
      <section className="bg-gray-900 py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-white mb-4">Built for the world</h2>
          <p className="text-gray-400 text-sm mb-8">
            Automatic tax profiles, Zakat calculation for GCC, VAT tracking — Keel adapts to your country&apos;s rules on signup.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {REGIONS.map((r) => (
              <span key={r} className="bg-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-full font-medium">
                {r}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-12">Up and running in 2 minutes</h2>
          <div className="space-y-6 text-left">
            {[
              { n: "1", title: "Sign in with Google", desc: "One click. No password." },
              { n: "2", title: "Tell us your setup", desc: "Country, income type, monthly expenses. 4 questions. No bank login needed." },
              { n: "3", title: "Log your income as it arrives", desc: "Every payment logged → Keel updates your budget, tax jar, and runway in real time." },
              { n: "4", title: "Know exactly where you stand", desc: "Dashboard shows your safe budget, runway, tax reserve, and income mode at a glance." },
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-keel-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                  {s.n}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{s.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Free to start. Upgrade when ready.</h2>
          <p className="text-gray-500 text-sm mb-8">Full access during beta. Paid plans coming soon.</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <p className="text-4xl font-black text-gray-900 mb-1">$0</p>
            <p className="text-gray-500 text-sm mb-6">Free beta access</p>
            <ul className="space-y-3 text-sm text-gray-600 mb-8 text-left max-w-xs mx-auto">
              {[
                "Income smoothing dashboard",
                "Tax / Zakat jar",
                "Runway calculator",
                "Can I Afford This? tool",
                "9 country tax profiles",
                "Unlimited income logging",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-keel-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => signIn("github", { callbackUrl: "/onboarding" })}
              className="w-full bg-keel-600 hover:bg-keel-700 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              Get free access
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-keel-600 py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Stop guessing. Start keeling.</h2>
          <p className="text-keel-100 mb-8">Join the waitlist for early access. Free during beta.</p>
          <button
            onClick={() => signIn("github", { callbackUrl: "/onboarding" })}
            className="bg-white text-keel-700 font-bold px-10 py-4 rounded-xl text-lg hover:bg-keel-50 transition-colors"
          >
            I want stable finances
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <div className="w-6 h-6 bg-keel-500 rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">K</span>
            </div>
            Keel
          </div>
          <p>Built for freelancers · Works in 9+ countries</p>
          <p className="text-xs">&copy; {new Date().getFullYear()} Keel. Not financial advice.</p>
        </div>
      </footer>
    </div>
  )
}
