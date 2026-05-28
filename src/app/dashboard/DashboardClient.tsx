"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import Image from "next/image"
import {
  TrendingUp, Shield, Anchor, Plus, LogOut,
  AlertTriangle, CheckCircle2, TrendingDown, Zap, X, Loader2,
  ArrowUpRight, Wallet,
} from "lucide-react"
import { TAX_PROFILES } from "@/lib/tax-profiles"
import { formatCurrency, canIAffordThis } from "@/lib/finance"
import type { DashboardData } from "@/types"

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
}

const MODE_CONFIG = {
  lean: {
    label: "Lean month",
    dot: "bg-rose-500",
    text: "text-rose-600",
    bar: "bg-rose-500",
    Icon: TrendingDown,
    hint: "Below average — tighten spending",
  },
  normal: {
    label: "On track",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    bar: "bg-emerald-500",
    Icon: CheckCircle2,
    hint: "Normal month — budget as planned",
  },
  flush: {
    label: "Flush month",
    dot: "bg-indigo-500",
    text: "text-indigo-600",
    bar: "bg-indigo-500",
    Icon: TrendingUp,
    hint: "Above average — save the surplus",
  },
}

function RunwayBar({ months }: { months: number }) {
  const capped = Math.min(months, 12)
  const pct = (capped / 12) * 100
  const color =
    months < 1.5 ? "bg-rose-500" : months < 3 ? "bg-amber-400" : "bg-emerald-500"
  return (
    <div>
      <div className="flex justify-between text-[11px] text-slate-400 mb-2 font-medium">
        <span>0 mo</span><span>3</span><span>6</span><span>12+</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
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

function MetricCard({
  icon: Icon,
  iconColor,
  label,
  value,
  sub,
  children,
  accentClass = "border-l-slate-200",
}: {
  icon: React.ElementType
  iconColor: string
  label: string
  value: string
  sub: string
  children?: React.ReactNode
  accentClass?: string
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${accentClass} p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <p className="text-[2rem] font-black text-slate-900 leading-none mb-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1.5">{sub}</p>
      {children && <div className="mt-4 pt-4 border-t border-slate-100">{children}</div>}
    </div>
  )
}

export default function DashboardClient({ user, dashboardData: d }: Props) {
  const profile = TAX_PROFILES[user.regionCode] ?? TAX_PROFILES.US
  const fmt = (n: number) => formatCurrency(n, profile.currencySymbol, profile.currency)
  const m = MODE_CONFIG[d.mode]

  const [showLogIncome, setShowLogIncome] = useState(false)
  const [amount, setAmount] = useState("")
  const [source, setSource] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [logging, setLogging] = useState(false)
  const [affordAmount, setAffordAmount] = useState("")
  const [affordResult, setAffordResult] = useState<ReturnType<typeof canIAffordThis> | null>(null)

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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <Anchor className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg text-slate-900 tracking-tight">Keel</span>
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${m.text} border-current border-opacity-30`}>
              <span className={`w-1.5 h-1.5 rounded-full ${m.dot} animate-pulse`} />
              {m.label}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-500 hidden sm:block">{profile.flag} {profile.region}</span>
            {user.image && (
              <Image src={user.image} alt={user.name ?? ""} width={28} height={28} className="rounded-full ring-2 ring-slate-200" />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-7 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Hi, {firstName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{m.hint}</p>
          </div>
          <button
            onClick={() => setShowLogIncome(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm shadow-emerald-100 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Log income
          </button>
        </div>

        {/* Context strip */}
        <div className="flex items-center gap-3 text-sm text-slate-500 pb-1">
          <span>This month: <strong className="text-slate-800">{fmt(d.currentMonthIncome)}</strong></span>
          <span className="text-slate-300">·</span>
          <span>6-mo avg: <strong className="text-slate-800">{fmt(d.rollingAverage)}</strong></span>
          <span className="text-slate-300">·</span>
          <span>Reserve: <strong className="text-slate-800">{d.reservePercent}%</strong></span>
        </div>

        {/* 3 core metrics */}
        <div className="grid md:grid-cols-3 gap-4">
          <MetricCard
            icon={TrendingUp}
            iconColor="bg-emerald-50 text-emerald-600"
            label="Safe monthly budget"
            value={fmt(d.safeBudget)}
            sub={`6-mo avg minus ${d.reservePercent}% tax reserve`}
            accentClass="border-l-emerald-400"
          />

          <MetricCard
            icon={Shield}
            iconColor="bg-amber-50 text-amber-600"
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
              <p className="text-[10px] text-slate-400 pt-1">{profile.disclaimer}</p>
            </div>
          </MetricCard>

          <MetricCard
            icon={Wallet}
            iconColor="bg-indigo-50 text-indigo-600"
            label="Runway"
            value={d.runwayMonths >= 12 ? "12+ mo" : `${d.runwayMonths.toFixed(1)} mo`}
            sub={
              d.runwayMonths < 1.5
                ? "Critical — top up savings now"
                : d.runwayMonths < 3
                ? "Low — aim for 3+ months"
                : "Healthy — you have a cushion"
            }
            accentClass="border-l-indigo-400"
          >
            <RunwayBar months={d.runwayMonths} />
          </MetricCard>
        </div>

        {/* Can I Afford + Chart */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Afford Calc */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Can I afford this?</h3>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">{profile.currencySymbol}</span>
                <input
                  type="number"
                  value={affordAmount}
                  onChange={(e) => { setAffordAmount(e.target.value); setAffordResult(null) }}
                  placeholder="5000"
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleAffordCheck}
                className="bg-slate-900 hover:bg-slate-700 text-white font-bold px-4 rounded-xl text-sm transition-colors"
              >
                Check
              </button>
            </div>
            {affordResult && (
              <div className={`rounded-xl p-3.5 text-sm ${
                affordResult.verdict === "yes"
                  ? "bg-emerald-50 border border-emerald-200"
                  : affordResult.verdict === "maybe"
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-rose-50 border border-rose-200"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {affordResult.verdict === "yes"
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    : affordResult.verdict === "maybe"
                    ? <AlertTriangle className="w-4 h-4 text-amber-600" />
                    : <X className="w-4 h-4 text-rose-600" />}
                  <span className={`font-black text-sm ${
                    affordResult.verdict === "yes" ? "text-emerald-700" :
                    affordResult.verdict === "maybe" ? "text-amber-700" : "text-rose-700"
                  }`}>
                    {affordResult.verdict === "yes" ? "Yes, you can" : affordResult.verdict === "maybe" ? "Possible but tight" : "Not right now"}
                  </span>
                </div>
                <p className="text-slate-600 text-xs">{affordResult.reason}</p>
                {affordResult.runwayAfter > 0 && (
                  <p className="text-xs text-slate-400 mt-1.5">Runway after: {affordResult.runwayAfter.toFixed(1)} months</p>
                )}
              </div>
            )}
          </div>

          {/* Income Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Income — last 6 months</h3>
              <ArrowUpRight className="w-4 h-4 text-slate-300" />
            </div>
            {d.monthlyChart.length > 0 ? (
              <IncomeBar entries={d.monthlyChart} />
            ) : (
              <div className="h-24 flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-slate-400">No income logged yet</p>
                <button onClick={() => setShowLogIncome(true)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Log your first payment →</button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Income */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent payments</h3>
            <button
              onClick={() => setShowLogIncome(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {d.recentEntries.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-slate-400 text-sm mb-3">No payments logged yet.</p>
              <button
                onClick={() => setShowLogIncome(true)}
                className="text-emerald-600 font-semibold text-sm hover:text-emerald-700"
              >
                Log your first payment →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {d.recentEntries.map((e) => (
                <div key={e.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
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
      </div>

      {/* Log Income Modal */}
      {showLogIncome && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowLogIncome(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
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
