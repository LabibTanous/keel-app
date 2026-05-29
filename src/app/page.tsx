"use client"

import { signIn } from "next-auth/react"
import { TrendingUp, Shield, Calculator, Zap, Globe, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react"

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Income smoothing",
    desc: "6-month rolling average gives you a real monthly budget — not the illusion of a good month.",
  },
  {
    icon: Shield,
    title: "Tax & Zakat reserve",
    desc: "Every payment auto-sets aside the right % for your country. No surprises at year-end.",
  },
  {
    icon: Calculator,
    title: "Runway meter",
    desc: "One number: how many months you can survive if income stops today.",
  },
  {
    icon: Zap,
    title: "Can I afford this?",
    desc: "Type an amount. Get a verdict. Know the runway impact before you spend.",
  },
  {
    icon: Globe,
    title: "Built for the world",
    desc: "US, UK, UAE, Saudi, Canada, Australia, Germany, India, Philippines. Your country's rules, automatic.",
  },
]

const MODES = [
  {
    key: "LEAN",
    dot: "bg-rose-500",
    desc: "Below your average. Keel tightens your spending limit automatically.",
  },
  {
    key: "NORMAL",
    dot: "bg-emerald-500",
    desc: "On track. Budget based on your rolling average.",
  },
  {
    key: "FLUSH",
    dot: "bg-indigo-500",
    desc: "Above average. Keel flags the surplus — so you save it, not spend it.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">K</span>
            </div>
            <span className="font-black text-xl text-slate-900 tracking-tight">Keel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden sm:block">Free · No bank login</span>
            <button
              onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
              className="bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-slate-900 pt-20 pb-24 px-5 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-900/40 border border-emerald-800 px-3 py-1.5 rounded-full mb-8">
            <Globe className="w-3.5 h-3.5" /> UAE · Saudi · US · UK · India + more
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.08] tracking-tight mb-6">
            Your income changes.<br />
            <span className="text-emerald-400">Your budget shouldn&apos;t.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
            Keel is the financial tool for freelancers, gig workers, and creators.
            Income smoothing, tax reserve, runway tracker — one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
            <button
              onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
              className="inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-emerald-900/30"
            >
              Start for free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => signIn("demo", { callbackUrl: "/dashboard" })}
              className="inline-flex items-center gap-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-4 rounded-xl text-base transition-colors"
            >
              Try demo — no login
            </button>
          </div>
          <p className="text-xs text-slate-600">No credit card. No bank connection. Setup in 2 minutes.</p>
        </div>
      </section>

      {/* Country bar */}
      <section className="border-b border-slate-100 py-4 px-5">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-7 gap-y-2">
          {["🇺🇸 US", "🇦🇪 UAE", "🇸🇦 Saudi", "🇬🇧 UK", "🇨🇦 Canada", "🇦🇺 Australia", "🇩🇪 Germany", "🇮🇳 India", "🇵🇭 Philippines"].map((r) => (
            <span key={r} className="text-sm text-slate-500 font-medium">{r}</span>
          ))}
        </div>
      </section>

      {/* Pain vs Solution */}
      <section className="py-20 px-5">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-4">The problem</p>
            <h2 className="text-3xl font-black text-slate-900 mb-6 leading-tight">Budget apps are built for salaries.<br />You don&apos;t have one.</h2>
            <div className="space-y-3">
              {[
                "Made AED 18K last month, AED 2K this month — now what?",
                "Owe thousands in taxes I never saved for",
                "Can't answer 'can I afford this?' with confidence",
                "Every app assumes a fixed monthly income",
              ].map((p) => (
                <div key={p} className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
                  <span className="text-rose-400 mt-0.5 shrink-0 font-bold text-sm">✕</span>
                  <p className="text-sm text-slate-700 italic">&ldquo;{p}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-4">Keel fixes this</p>
            <h2 className="text-3xl font-black text-slate-900 mb-6 leading-tight">Stability for income<br />that changes every month.</h2>
            <div className="space-y-3">
              {[
                "6-month rolling average = your real monthly budget",
                "Auto-reserve the right % for taxes by country",
                "Runway: months you survive if income stops today",
                "Check affordability of any purchase instantly",
              ].map((s) => (
                <div key={s} className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-700">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Income Modes */}
      <section className="bg-slate-900 py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">Three modes. Zero guesswork.</h2>
            <p className="text-slate-400">Keel detects where you are in your income cycle and adapts automatically.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {MODES.map((m) => (
              <div key={m.key} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">{m.key}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Everything you need. Nothing you don&apos;t.</h2>
            <p className="text-slate-500">Built around one insight: variable income needs variable budgeting.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-slate-100 group-hover:bg-emerald-50 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <f.icon className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="font-black text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">Up and running in 2 minutes</h2>
          <div className="space-y-4">
            {[
              { n: "1", title: "Sign in with Google", desc: "One click. No password." },
              { n: "2", title: "Tell us your setup", desc: "Country, income type, expenses. 4 questions." },
              { n: "3", title: "Log income as it arrives", desc: "Every payment updates your budget, tax jar, and runway instantly." },
              { n: "4", title: "Know exactly where you stand", desc: "Dashboard shows your safe budget, runway, reserve, and income mode." },
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                  {s.n}
                </div>
                <div>
                  <p className="font-black text-slate-900">{s.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-5">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Free during beta</h2>
          <p className="text-slate-500 text-sm mb-8">Full access. No card required.</p>
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-left">
            <p className="text-5xl font-black text-slate-900 mb-1">$0</p>
            <p className="text-slate-400 text-sm mb-7">Beta access — everything included</p>
            <ul className="space-y-3 mb-8">
              {[
                "Income smoothing dashboard",
                "Tax & Zakat reserve (9 countries)",
                "Runway calculator",
                "Can I Afford This? tool",
                "Unlimited income logging",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl transition-colors"
            >
              Get free access
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900 py-20 px-5 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-4">Stop guessing. Start keeling.</h2>
          <p className="text-slate-400 mb-8">Join freelancers and creators who know exactly where they stand — every month.</p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-10 py-4 rounded-xl text-lg transition-colors"
          >
            Get started free <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <div className="flex items-center gap-2 font-black text-slate-900">
            <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">K</span>
            </div>
            Keel
          </div>
          <p>Financial stability for irregular income · 9+ countries</p>
          <p className="text-xs">&copy; {new Date().getFullYear()} Keel · Not financial advice</p>
        </div>
      </footer>
    </div>
  )
}
