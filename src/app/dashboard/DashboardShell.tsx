"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Anchor, Plus, LogOut, Settings, Home, User, X, Loader2, Smartphone, ChevronDown, Copy, Check,
} from "lucide-react"
import { Dock } from "@/components/ui/dock-two"
import TenseToggle from "@/components/dashboard/TenseToggle"
import BackView from "@/components/dashboard/BackView"
import ForwardView from "@/components/dashboard/ForwardView"
import type { IncomeStats, MonthlyPlan, PaycheckRecommendation, Forecast, Signal } from "@/lib/engine"
import type { TaxProfile } from "@/lib/engine"

// ─── Palette ──────────────────────────────────────────────────────────────────
const BG = "#EBE6DA"
const SURFACE = "#FBFAF5"
const INK = "#1A201C"
const PINE = "#1F4D3A"

interface Props {
  user: {
    name: string | null
    email: string
    image: string | null
    regionCode: string
    isMuslim: boolean
    monthlyExpenses: number
    savingsBalance: number
  }
  plan: {
    stats: IncomeStats
    recommendation: PaycheckRecommendation
    plan: MonthlyPlan
    signals: Signal[]
    forecast: Forecast
    paycheck: number
  }
  tax: TaxProfile
  recentEntries: { id: string; source: string; amount: number; date: string }[]
  logToken: string
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
    <button onClick={copy} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity">
      {copied
        ? <Check className="w-3.5 h-3.5" style={{ color: "#2FA374" }} />
        : <Copy className="w-3.5 h-3.5" style={{ color: INK, opacity: 0.4 }} />
      }
    </button>
  )
}

export default function DashboardShell({ user, plan, tax, recentEntries, logToken }: Props) {
  const router = useRouter()
  const [tense, setTense] = useState<"forward" | "back">("forward")
  const [showLogIncome, setShowLogIncome] = useState(false)
  const [amount, setAmount] = useState("")
  const [source, setSource] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [logging, setLogging] = useState(false)
  const [showShortcut, setShowShortcut] = useState(false)

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://keel-app-gold.vercel.app"
  const firstName = user.name?.split(" ")[0] ?? "there"
  const currency = tax.currencySymbol

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

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b" style={{ background: SURFACE, borderColor: `${INK}10` }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: PINE }}>
              <Anchor className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight" style={{ color: INK }}>Keel</span>
          </div>
          <div className="flex items-center gap-1.5">
            {user.image && (
              <Image src={user.image} alt={user.name ?? ""} width={26} height={26} className="rounded-full ring-2 ring-black ring-opacity-10 hidden sm:block" />
            )}
            <button onClick={() => router.push("/profile")} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity">
              <Settings className="w-4 h-4" style={{ color: INK, opacity: 0.5 }} />
            </button>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity">
              <LogOut className="w-4 h-4" style={{ color: INK, opacity: 0.5 }} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-36 space-y-4">
        {/* Greeting */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black" style={{ color: INK }}>Hi, {firstName}</h1>
            <p className="text-sm mt-0.5" style={{ color: INK, opacity: 0.5 }}>
              {tense === "forward" ? "Here's your plan" : "What came in"}
            </p>
          </div>
          <button
            onClick={() => setShowLogIncome(true)}
            className="hidden sm:flex items-center gap-2 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm shrink-0"
            style={{ background: PINE }}
          >
            <Plus className="w-4 h-4" /> Log income
          </button>
        </div>

        {/* Tense toggle */}
        <TenseToggle active={tense} onChange={setTense} />

        {/* Views */}
        {tense === "forward" ? (
          <ForwardView
            paycheck={plan.paycheck}
            plan={plan.plan}
            forecast={plan.forecast}
            signals={plan.signals}
            currency={currency}
            hasZakat={tax.hasZakat}
            payZakat={user.isMuslim}
          />
        ) : (
          <BackView entries={recentEntries} currency={currency} />
        )}

        {/* iOS Shortcut */}
        <div className="rounded-2xl overflow-hidden" style={{ background: SURFACE }}>
          <button
            onClick={() => setShowShortcut(v => !v)}
            className="w-full px-4 py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: INK }}>
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: INK }}>Log from your phone</p>
                <p className="text-xs" style={{ color: INK, opacity: 0.45 }}>iOS Shortcut — one tap, no app needed</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showShortcut ? "rotate-180" : ""}`} style={{ color: INK, opacity: 0.4 }} />
          </button>

          {showShortcut && (
            <div className="px-4 pb-5 border-t pt-4 space-y-4" style={{ borderColor: `${INK}10` }}>
              <p className="text-xs" style={{ color: INK, opacity: 0.5 }}>
                Set up an iOS Shortcut that hits the URL below. Replace {"{amount}"} and {"{source}"} with Shortcut inputs.
              </p>
              <div className="rounded-xl border p-3 flex items-start gap-2" style={{ background: BG, borderColor: `${INK}12` }}>
                <code className="text-xs break-all flex-1 font-mono leading-relaxed" style={{ color: INK }}>
                  {appUrl}/api/quick-log?token={logToken}&amp;amount={"{amount}"}&amp;source={"{source}"}
                </code>
                <CopyButton text={`${appUrl}/api/quick-log?token=${logToken}&amount={amount}&source={source}`} />
              </div>
              <p className="text-[10px]" style={{ color: INK, opacity: 0.35 }}>Keep this URL private — anyone with it can log to your account.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Dock */}
      <div className="fixed bottom-4 left-0 right-0 z-30 px-4 sm:bottom-6">
        <Dock
          items={[
            { icon: Home, label: "Dashboard", active: true, onClick: () => {} },
            { icon: Plus, label: "Log Income", onClick: () => setShowLogIncome(true) },
            { icon: User, label: "Profile", onClick: () => router.push("/profile") },
            { icon: Settings, label: "Settings", onClick: () => router.push("/profile") },
          ]}
        />
      </div>

      {/* Log Income Modal */}
      {showLogIncome && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: `${INK}80` }}
          onClick={() => setShowLogIncome(false)}
        >
          <div
            className="rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 shadow-2xl"
            style={{ background: SURFACE }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: `${INK}20` }} />
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-black" style={{ color: INK }}>Log a payment</h3>
                <p className="text-xs mt-0.5" style={{ color: INK, opacity: 0.5 }}>Record income as you receive it</p>
              </div>
              <button
                onClick={() => setShowLogIncome(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-70 transition-opacity"
                style={{ background: BG }}
              >
                <X className="w-4 h-4" style={{ color: INK }} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: INK, opacity: 0.5 }}>Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: INK, opacity: 0.5 }}>{tax.currencySymbol}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-xl font-black focus:outline-none focus:ring-2"
                    style={{ background: BG, color: INK, border: `2px solid ${PINE}22` }}
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: INK, opacity: 0.5 }}>Source</label>
                <input
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="Client · Fiverr · DoorDash"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ background: BG, color: INK, border: `2px solid ${PINE}22` }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: INK, opacity: 0.5 }}>Date received</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ background: BG, color: INK, border: `2px solid ${PINE}22` }}
                />
              </div>
            </div>
            <button
              onClick={handleLogIncome}
              disabled={logging || !amount}
              className="w-full mt-5 text-white font-black py-3.5 rounded-xl transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
              style={{ background: PINE }}
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
