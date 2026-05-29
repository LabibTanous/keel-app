"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  TrendingUp, Shield, Anchor, Plus, LogOut,
  AlertTriangle, CheckCircle2, TrendingDown, Zap, X, Loader2,
  ArrowUpRight, Wallet, Copy, Check, ChevronDown, Smartphone,
  Settings, Lightbulb, PieChart,
} from "lucide-react"
import { TAX_PROFILES } from "@/lib/tax-profiles"
import { formatCurrency, canIAffordThis } from "@/lib/finance"
import type { DashboardData, Advice } from "@/types"

interface Props {
  user: {
    name: string | null
    email: string
    image: string | null
    regionCode: string
    incomeType: string
    isMuslim: boolean
    monthlyExpenses: number
    savingsBalance: number
  }
  dashboardData: DashboardData
  logToken: string
}

const MODE_CONFIG = {
  lean: {
    label: "Lean month",
    dot: "bg-rose-500",
    badge: "bg-rose-50 border-rose-200 text-rose-700",
    Icon: TrendingDown,
    hint: "Below average — tighten spending",
  },
  normal: {
    label: "On track",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
    Icon: CheckCircle2,
    hint: "Normal month — budget as planned",
  },
  flush: {
    label: "Flush month",
    dot: "bg-indigo-500",
    badge: "bg-indigo-50 border-indigo-200 text-indigo-700",
    Icon: TrendingUp,
    hint: "Above average — save the surplus",
  },
}

function RunwayBar({ months }: { months: number }) {
  const capped = Math.min(months, 12)
  const pct = (capped / 12) * 100
  const color = months < 1.5 ? "bg-rose-500" : months < 3 ? "bg-amber-400" : "bg-emerald-500"
  return (
    <div>
      <div className="flex justify-between text-[11px] text-slate-400 mb-2 font-medium">
        <span>0 mo</span><span>3</span><span>6</span><span>12+</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  )
}

function IncomeBar({ entries }: { entries: { month: string; amount: number }[] }) {
  const max = Math.max(...entries.map((e) => e.amount), 1)
  return (
    <div className="flex items-end gap-2 h-24">
      {entries.map((e) => {
        const h = Math.max((e.amount / max) * 100, 3)
        const label = e.month.slice(5)
        return (
          <div key={e.month} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full bg-slate-200 hover:bg-emerald-500 rounded-md transition-colors duration-200 cursor-default"
              style={{ height: `${h}%` }}
              title={`${label}: ${e.amount.toLocaleString()}`}
            />
            <span className="text-[10px] text-slate-400 font-medium">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-3 py-2.5 text-center shadow-sm">
      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-black text-slate-900 leading-none truncate">{value}</p>
    </div>
  )
}

function MetricCard({
  icon: Icon, iconColor, label, value, sub, children, accentClass = "border-l-slate-200",
}: {
  icon: React.ElementType; iconColor: string; label: string; value: string; sub: string
  children?: React.ReactNode; accentClass?: string
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${accentClass} p-4 sm:p-5 shadow-sm`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <p className="text-3xl sm:text-[2rem] font-black text-slate-900 leading-none mb-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
      {children && <div className="mt-3 pt-3 border-t border-slate-100">{children}</div>}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function AdviceCard({ advice }: { advice: Advice }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  const colors = {
    warning: "bg-rose-50 border-rose-200 text-rose-800",
    tip: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  }
  const icons = {
    warning: AlertTriangle,
    tip: Lightbulb,
    info: ArrowUpRight,
    success: CheckCircle2,
  }
  const Icon = icons[advice.type]
  return (
    <div className={`rounded-xl border p-3.5 ${colors[advice.type]}`}>
      <div className="flex items-start gap-2.5">
        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-snug">{advice.title}</p>
          <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{advice.body}</p>
        </div>
        <button onClick={() => setDismissed(true)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function DashboardClient({ user, dashboardData: d, logToken }: Props) {
  const router = useRouter()
  const profile = TAX_PROFILES[user.regionCode] ?? TAX_PROFILES.AE
  const fmt = (n: number) => formatCurrency(n, profile.currencySymbol, profile.currency)
  const m = MODE_CONFIG[d.mode]

  const [showLogIncome, setShowLogIncome] = useState(false)
  const [amount, setAmount] = useState("")
  const [source, setSource] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [logging, setLogging] = useState(false)
  const [affordAmount, setAffordAmount] = useState("")
  const [affordResult, setAffordResult] = useState<ReturnType<typeof canIAffordThis> | null>(null)
  const [showShortcut, setShowShortcut] = useState(false)

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://keel-app-gold.vercel.app"

  const handleLogIncome = async () => {
    if (!amount || Number(amount) <= 0) return
    setLogging(true)
    await fetch("/api/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), source: source || "Income", date }),
    })
    setLogging(false)
    setShowLogIncome(false)
    setAmount("")
    setSource("")
    window.location.reload()
  }

  const handleAffordCheck = () => {
    const cost = Number(affordAmount)
    if (!cost || cost <= 0) return
    setAffordResult(canIAffordThis(cost, user.savingsBalance, user.monthlyExpenses, d.reserveBalance))
  }

  const firstName = user.name?.split(" ")[0] ?? "there"

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <Anchor className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg text-slate-900 tracking-tight">Keel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${m.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
              {m.label}
            </span>
            {user.image && (
              <Image src={user.image} alt={user.name ?? ""} width={26} height={26} className="rounded-full ring-2 ring-slate-200 hidden sm:block" />
            )}
            <button
              onClick={() => router.push("/profile")}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 pt-5 pb-28 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Hi, {firstName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{m.hint}</p>
          </div>
          <button
            onClick={() => setShowLogIncome(true)}
            className="hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Log income
          </button>
        </div>

        {/* Stats strip — 3-column grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatPill label="This month" value={fmt(d.currentMonthIncome)} />
          <StatPill label="6-mo avg" value={fmt(d.rollingAverage)} />
          <StatPill label="Reserve" value={`${d.reservePercent}%`} />
        </div>

        {/* 3 core metrics */}
        <div className="grid sm:grid-cols-3 gap-3">
          <MetricCard
            icon={TrendingUp} iconColor="bg-emerald-50 text-emerald-600"
            label="Safe monthly budget" value={fmt(d.safeBudget)}
            sub={`6-mo avg minus ${d.reservePercent}% tax reserve`}
            accentClass="border-l-emerald-400"
          />
          <MetricCard
            icon={Shield} iconColor="bg-amber-50 text-amber-600"
            label={user.isMuslim && profile.hasZakat ? "Tax + Zakat jar" : "Tax reserve"}
            value={fmt(d.reserveBalance)}
            sub={`${d.reservePercent}% auto-reserved · ${profile.hasZakat && user.isMuslim ? "Incl. Zakat" : "Estimate only"}`}
            accentClass="border-l-amber-400"
          >
            <div className="space-y-1.5">
              {profile.breakdown.slice(0, 2).map((b) => (
                <div key={b.label} className="flex justify-between text-xs">
                  <span className="text-slate-500">{b.label}</span>
                  <span className="font-semibold text-slate-700">{b.rate}</span>
                </div>
              ))}
              <p className="text-[10px] text-slate-400 pt-0.5">{profile.disclaimer}</p>
            </div>
          </MetricCard>
          <MetricCard
            icon={Wallet} iconColor="bg-indigo-50 text-indigo-600"
            label="Runway"
            value={d.runwayMonths >= 12 ? "12+ mo" : `${d.runwayMonths.toFixed(1)} mo`}
            sub={d.runwayMonths < 1.5 ? "Critical — top up savings now" : d.runwayMonths < 3 ? "Low — aim for 3+ months" : "Healthy — you have a cushion"}
            accentClass="border-l-indigo-400"
          >
            <RunwayBar months={d.runwayMonths} />
          </MetricCard>
        </div>

        {/* Can I Afford + Chart */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-none">Can I afford this?</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Checks savings minus tax reserve + runway impact</p>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">{profile.currencySymbol}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={affordAmount}
                  onChange={(e) => { setAffordAmount(e.target.value); setAffordResult(null) }}
                  placeholder="5000"
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent"
                />
              </div>
              <button onClick={handleAffordCheck} className="bg-slate-900 hover:bg-slate-700 text-white font-bold px-4 rounded-xl text-sm transition-colors">
                Check
              </button>
            </div>
            {affordResult && (
              <div className={`rounded-xl p-3 text-sm ${
                affordResult.verdict === "yes" ? "bg-emerald-50 border border-emerald-200"
                : affordResult.verdict === "maybe" ? "bg-amber-50 border border-amber-200"
                : "bg-rose-50 border border-rose-200"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {affordResult.verdict === "yes" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  : affordResult.verdict === "maybe" ? <AlertTriangle className="w-4 h-4 text-amber-600" />
                  : <X className="w-4 h-4 text-rose-600" />}
                  <span className={`font-black text-sm ${
                    affordResult.verdict === "yes" ? "text-emerald-700"
                    : affordResult.verdict === "maybe" ? "text-amber-700"
                    : "text-rose-700"
                  }`}>
                    {affordResult.verdict === "yes" ? "Yes, you can" : affordResult.verdict === "maybe" ? "Possible but tight" : "Not right now"}
                  </span>
                </div>
                <p className="text-slate-600 text-xs">{affordResult.reason}</p>
                {affordResult.runwayAfter > 0 && (
                  <p className="text-xs text-slate-400 mt-1">Runway after: {affordResult.runwayAfter.toFixed(1)} months</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Income — last 6 months</h3>
              <ArrowUpRight className="w-4 h-4 text-slate-300" />
            </div>
            {d.monthlyChart.length > 0 ? (
              <IncomeBar entries={d.monthlyChart} />
            ) : (
              <div className="h-24 flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-1">
                  <TrendingUp className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">No income logged yet</p>
                <button onClick={() => setShowLogIncome(true)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  Log your first payment →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Income */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent payments</h3>
            <button onClick={() => setShowLogIncome(true)} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {d.recentEntries.length === 0 ? (
            <div className="py-12 text-center px-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-slate-600 font-semibold text-sm mb-1">No payments yet</p>
              <p className="text-slate-400 text-xs mb-4">Log income as you receive it — freelance, gigs, transfers, anything.</p>
              <button
                onClick={() => setShowLogIncome(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl"
              >
                <Plus className="w-4 h-4" /> Log first payment
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {d.recentEntries.map((e) => (
                <div key={e.id} className="px-4 sm:px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{e.source}</p>
                      <p className="text-xs text-slate-400">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-emerald-700">{fmt(Number(e.amount))}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advice section */}
        {d.advice.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Advice</h3>
            </div>
            {d.advice.map((a) => <AdviceCard key={a.id} advice={a} />)}
          </div>
        )}

        {/* Source breakdown */}
        {d.sourceBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Income by source</h3>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              {(() => {
                const total = d.sourceBreakdown.reduce((s, x) => s + x.amount, 0)
                const colors = ["bg-emerald-500", "bg-indigo-500", "bg-amber-400", "bg-rose-400", "bg-slate-400", "bg-teal-400"]
                return d.sourceBreakdown.map((s, i) => {
                  const pct = total > 0 ? Math.round((s.amount / total) * 100) : 0
                  return (
                    <div key={s.source}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                          <span className="font-semibold text-slate-700 truncate max-w-[140px]">{s.source}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-slate-500">{pct}%</span>
                          <span className="font-black text-slate-900">{fmt(s.amount)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-1.5 rounded-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {/* iOS Shortcut */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowShortcut((v) => !v)}
            className="w-full px-4 sm:px-5 py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Log income from your phone</p>
                <p className="text-xs text-slate-400">iOS Shortcut — one tap, no app needed</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showShortcut ? "rotate-180" : ""}`} />
          </button>

          {showShortcut && (
            <div className="px-4 sm:px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2.5">How to set it up</p>
                <ol className="space-y-2">
                  {[
                    "Open iOS Shortcuts app → tap +",
                    "Add Ask for Input (label: Amount, type: Number)",
                    "Add Ask for Input (label: Source, type: Text)",
                    'Add Get Contents of URL → paste your URL below',
                    "Replace {amount} and {source} with the Shortcut inputs",
                    'Name it "Log Income" → Add to Home Screen',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="w-5 h-5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Your personal URL</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-start gap-2">
                  <code className="text-xs text-slate-700 break-all flex-1 font-mono leading-relaxed">
                    {appUrl}/api/quick-log?token={logToken}&amp;amount={"{"+ "amount" + "}"}&amp;source={"{"+ "source" + "}"}
                  </code>
                  <CopyButton text={`${appUrl}/api/quick-log?token=${logToken}&amount={amount}&source={source}`} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Keep this private — anyone with it can log to your account.</p>
              </div>

              <a
                href={`/api/quick-log?token=${logToken}&amount=1000&source=Test`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Test: log AED 1,000 now
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowLogIncome(true)}
        className="sm:hidden fixed bottom-6 right-4 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center z-30 transition-transform active:scale-95"
        aria-label="Log income"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Log Income Modal */}
      {showLogIncome && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setShowLogIncome(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900">Log a payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Record income as you receive it</p>
              </div>
              <button onClick={() => setShowLogIncome(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">{profile.currencySymbol}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-slate-200 rounded-xl text-xl font-black focus:outline-none focus:border-emerald-500 transition-colors"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Source</label>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Client · Fiverr · DoorDash"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Date received</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <button
              onClick={handleLogIncome}
              disabled={logging || !amount}
              className="w-full mt-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {logging ? "Saving…" : "Log payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
