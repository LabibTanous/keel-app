"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import {
  TrendingUp, Shield, Anchor, PlusCircle, LogOut, ChevronDown,
  AlertTriangle, CheckCircle, TrendingDown, Zap, X, Loader2,
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
    label: "LEAN MODE",
    emoji: "⚠️",
    desc: "Below average. Stick to essentials.",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-700",
    Icon: TrendingDown,
  },
  normal: {
    label: "ON TRACK",
    emoji: "✅",
    desc: "Normal month. Budget as planned.",
    bg: "bg-keel-50",
    border: "border-keel-200",
    text: "text-keel-700",
    badge: "bg-keel-100 text-keel-700",
    Icon: CheckCircle,
  },
  flush: {
    label: "FLUSH MODE",
    emoji: "💰",
    desc: "Above average. Save the surplus.",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    Icon: TrendingUp,
  },
}

function RunwayBar({ months }: { months: number }) {
  const capped = Math.min(months, 12)
  const pct = (capped / 12) * 100
  const color = months < 1.5 ? "bg-red-500" : months < 3 ? "bg-amber-400" : "bg-keel-500"
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>0</span><span>3mo</span><span>6mo</span><span>12mo+</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function IncomeBar({ entries }: { entries: { month: string; amount: number }[] }) {
  const max = Math.max(...entries.map((e) => e.amount), 1)
  return (
    <div className="flex items-end gap-1.5 h-20">
      {entries.map((e) => {
        const h = Math.max((e.amount / max) * 100, 4)
        const label = e.month.slice(5)
        return (
          <div key={e.month} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-keel-400 rounded-sm transition-all duration-500 hover:bg-keel-600"
              style={{ height: `${h}%` }}
              title={`${label}: ${e.amount.toLocaleString()}`}
            />
            <span className="text-[10px] text-gray-400">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardClient({ user, dashboardData: d }: Props) {
  const profile = TAX_PROFILES[user.regionCode] ?? TAX_PROFILES.US
  const fmt = (n: number) => formatCurrency(n, profile.currencySymbol, profile.currency)
  const modeConfig = MODE_CONFIG[d.mode]

  const [showLogIncome, setShowLogIncome] = useState(false)
  const [showAffordCalc, setShowAffordCalc] = useState(false)
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
    const result = canIAffordThis(
      cost,
      user.savingsBalance,
      user.monthlyExpenses,
      d.reserveBalance
    )
    setAffordResult(result)
  }

  const firstName = user.name?.split(" ")[0] ?? "there"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-keel-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">K</span>
            </div>
            <span className="font-extrabold text-lg text-gray-900">Keel</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-keel-50 text-keel-700 font-semibold px-2.5 py-1 rounded-full">
              {profile.flag} {profile.region}
            </span>
            {user.image && (
              <Image src={user.image} alt={user.name ?? ""} width={30} height={30} className="rounded-full" />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Header + Log Income */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Hi, {firstName} 👋</h1>
            <p className="text-sm text-gray-500 mt-0.5">Here's your financial snapshot</p>
          </div>
          <button
            onClick={() => setShowLogIncome(true)}
            className="flex items-center gap-2 bg-keel-600 hover:bg-keel-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Log income
          </button>
        </div>

        {/* Mode Banner */}
        <div className={`rounded-xl border-2 p-5 flex items-center gap-4 ${modeConfig.bg} ${modeConfig.border}`}>
          <div className="text-3xl">{modeConfig.emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${modeConfig.badge}`}>
                {modeConfig.label}
              </span>
            </div>
            <p className={`text-sm font-medium ${modeConfig.text}`}>{modeConfig.desc}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              This month: {fmt(d.currentMonthIncome)} &nbsp;·&nbsp; 6-month avg: {fmt(d.rollingAverage)}
            </p>
          </div>
        </div>

        {/* 3 core metrics */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Safe Budget */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-keel-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-keel-600" />
              </div>
              <span className="text-sm font-semibold text-gray-600">Safe monthly budget</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{fmt(d.safeBudget)}</p>
            <p className="text-xs text-gray-400 mt-1">
              Based on 6-month avg minus {d.reservePercent}% reserve
            </p>
          </div>

          {/* Tax / Obligation Jar */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-sm font-semibold text-gray-600">
                {user.isMuslim && profile.hasZakat ? "Tax + Zakat jar" : "Tax reserve"}
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900">{fmt(d.reserveBalance)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {d.reservePercent}% auto-reserved · {profile.hasZakat && user.isMuslim ? "Includes Zakat" : "Estimate only"}
            </p>
            <div className="mt-3 pt-3 border-t border-gray-50">
              {profile.breakdown.slice(0, 2).map((b) => (
                <div key={b.label} className="flex justify-between text-xs py-0.5">
                  <span className="text-gray-500">{b.label}</span>
                  <span className="font-medium text-gray-700">{b.rate}</span>
                </div>
              ))}
              <p className="text-[10px] text-gray-400 mt-1">{profile.disclaimer}</p>
            </div>
          </div>

          {/* Runway */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Anchor className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-600">Runway</span>
            </div>
            <p className="text-3xl font-black text-gray-900">
              {d.runwayMonths >= 12 ? "12+ mo" : `${d.runwayMonths.toFixed(1)} mo`}
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-3">
              {d.runwayMonths < 1.5
                ? "⚠️ Critical — top up savings now"
                : d.runwayMonths < 3
                ? "🟡 Low — aim for 3+ months"
                : "✅ Healthy runway"}
            </p>
            <RunwayBar months={d.runwayMonths} />
          </div>
        </div>

        {/* Can I Afford This? + Income Chart */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Afford Calc */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-rose-600" />
              </div>
              <h3 className="font-bold text-gray-900">Can I afford this?</h3>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{profile.currencySymbol}</span>
                <input
                  type="number"
                  value={affordAmount}
                  onChange={(e) => { setAffordAmount(e.target.value); setAffordResult(null) }}
                  placeholder="Amount"
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-keel-300"
                />
              </div>
              <button
                onClick={handleAffordCheck}
                className="bg-keel-600 text-white font-semibold px-4 rounded-lg text-sm hover:bg-keel-700 transition-colors"
              >
                Check
              </button>
            </div>
            {affordResult && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  affordResult.verdict === "yes"
                    ? "bg-keel-50 border border-keel-200"
                    : affordResult.verdict === "maybe"
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">
                    {affordResult.verdict === "yes" ? "✅" : affordResult.verdict === "maybe" ? "⚠️" : "❌"}
                  </span>
                  <span className="font-bold capitalize">{affordResult.verdict === "maybe" ? "Maybe" : affordResult.verdict === "yes" ? "Yes" : "No"}</span>
                </div>
                <p className="text-gray-600 text-xs">{affordResult.reason}</p>
                {affordResult.runwayAfter > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Runway after: {affordResult.runwayAfter.toFixed(1)} months
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Income Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Income last 6 months</h3>
            {d.monthlyChart.length > 0 ? (
              <IncomeBar entries={d.monthlyChart} />
            ) : (
              <div className="h-20 flex items-center justify-center text-sm text-gray-400">
                Log income to see your chart
              </div>
            )}
          </div>
        </div>

        {/* Recent Income */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Recent income</h3>
            <button
              onClick={() => setShowLogIncome(true)}
              className="text-xs font-semibold text-keel-600 hover:text-keel-700 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add payment
            </button>
          </div>
          {d.recentEntries.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm mb-3">No income logged yet.</p>
              <button
                onClick={() => setShowLogIncome(true)}
                className="text-keel-600 font-semibold text-sm hover:text-keel-700"
              >
                Log your first payment →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {d.recentEntries.map((e) => (
                <div key={e.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.source}</p>
                    <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  <p className="text-sm font-bold text-keel-700">{fmt(e.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Income Modal */}
      {showLogIncome && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLogIncome(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-900">Log a payment</h3>
              <button onClick={() => setShowLogIncome(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Amount ({profile.currency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{profile.currencySymbol}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-keel-300 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Source</label>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Client payment, Fiverr, DoorDash…"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-keel-300 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date received</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-keel-300 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={handleLogIncome}
              disabled={logging || !amount}
              className="w-full mt-5 bg-keel-600 hover:bg-keel-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {logging ? "Saving..." : "Log payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
