"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { Anchor, ChevronLeft, Save, Loader2, LogOut, User, Globe, DollarSign, Briefcase, Check } from "lucide-react"
import { REGIONS, TAX_PROFILES } from "@/lib/tax-profiles"
import { INCOME_TYPE_LABELS, type IncomeType } from "@/types"

const INCOME_TYPES: IncomeType[] = [
  "freelancer", "gig_worker", "creator", "consultant", "business_owner", "mixed",
]

export default function ProfilePage() {
  const router = useRouter()
  const { status } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [regionCode, setRegionCode] = useState("AE")
  const [incomeType, setIncomeType] = useState<IncomeType>("freelancer")
  const [isMuslim, setIsMuslim] = useState(false)
  const [monthlyExpenses, setMonthlyExpenses] = useState("")
  const [savingsBalance, setSavingsBalance] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return }
    if (status === "authenticated") {
      fetch("/api/user")
        .then((r) => r.json())
        .then(({ user }) => {
          if (user) {
            setRegionCode(user.region_code || "AE")
            setIncomeType(user.income_type || "freelancer")
            setIsMuslim(user.is_muslim || false)
            setMonthlyExpenses(String(user.monthly_expenses || ""))
            setSavingsBalance(String(user.savings_balance || ""))
          }
        })
        .finally(() => setLoading(false))
    }
  }, [status, router])

  const profile = TAX_PROFILES[regionCode]

  const handleSave = async () => {
    setSaving(true)
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        regionCode,
        incomeType,
        isMuslim,
        monthlyExpenses: Number(monthlyExpenses) || 0,
        savingsBalance: Number(savingsBalance) || 0,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center">
                <Anchor className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-base text-slate-900">Settings</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            {saved ? <Check className="w-4 h-4" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Country */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <Globe className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Country & Tax Region</h2>
          </div>
          <div className="p-5">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {REGIONS.map((r) => (
                <button
                  key={r.code}
                  onClick={() => setRegionCode(r.code)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    regionCode === r.code
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-lg">{r.flag}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{r.region}</p>
                    <p className="text-xs text-slate-400">Reserve ~{TAX_PROFILES[r.code]?.reservePercent ?? 0}%</p>
                  </div>
                  {regionCode === r.code && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Income type */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <Briefcase className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Income Type</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-2.5">
              {INCOME_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setIncomeType(t)}
                  className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-left transition-all ${
                    incomeType === t
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-lg">
                    {t === "freelancer" ? "💻" : t === "gig_worker" ? "🚗" : t === "creator" ? "🎬" : t === "consultant" ? "📊" : t === "business_owner" ? "🏢" : "⚡"}
                  </span>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{INCOME_TYPE_LABELS[t]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zakat */}
        {["AE", "SA", "QA", "KW", "BH", "OM", "MY", "PK", "BD"].includes(regionCode) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Zakat Tracking</h2>
              <p className="text-xs text-slate-400 mt-0.5">Optional. Keel adds 2.5% to your reserve jar.</p>
            </div>
            <div className="p-5 flex gap-3">
              {[
                { val: true, label: "Yes, track Zakat", icon: "☪️" },
                { val: false, label: "Skip Zakat", icon: "→" },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  onClick={() => setIsMuslim(opt.val)}
                  className={`flex-1 flex items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all ${
                    isMuslim === opt.val
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="text-sm font-bold text-slate-900">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Finances */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Financial Setup</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Monthly expenses</label>
              <p className="text-xs text-slate-400 mb-2">Rent, food, bills, subscriptions — everything you pay each month</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">{profile?.currencySymbol ?? "$"}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(e.target.value)}
                  placeholder="3500"
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-lg font-black focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Current savings</label>
              <p className="text-xs text-slate-400 mb-2">Total savings available (excluding your tax reserve jar)</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">{profile?.currencySymbol ?? "$"}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={savingsBalance}
                  onChange={(e) => setSavingsBalance(e.target.value)}
                  placeholder="10000"
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-lg font-black focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button (mobile) */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {saved ? <Check className="w-4 h-4" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Changes saved!" : "Save changes"}
        </button>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-500 hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out / Start fresh
        </button>
      </div>
    </div>
  )
}
