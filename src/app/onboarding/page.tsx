"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { signIn } from "next-auth/react"
import { ChevronRight, ChevronLeft, Globe, Briefcase, DollarSign, Anchor, Loader2 } from "lucide-react"
import { REGIONS, TAX_PROFILES } from "@/lib/tax-profiles"
import { INCOME_TYPE_LABELS, type IncomeType } from "@/types"

type Step = "region" | "income_type" | "religion" | "expenses" | "savings"

const INCOME_TYPES: IncomeType[] = [
  "freelancer", "gig_worker", "creator", "consultant", "business_owner", "mixed",
]

const INCOME_LABELS: Record<IncomeType, { icon: string; sub: string }> = {
  freelancer:     { icon: "💻", sub: "Projects & contracts" },
  gig_worker:     { icon: "🚗", sub: "Deliveries, rides, tasks" },
  creator:        { icon: "🎬", sub: "Content & sponsorships" },
  consultant:     { icon: "📊", sub: "Advisory & strategy" },
  business_owner: { icon: "🏢", sub: "Business income" },
  mixed:          { icon: "⚡", sub: "Multiple sources" },
}

export default function OnboardingPage() {
  const router = useRouter()
  const { status } = useSession()

  // All hooks at top — no conditional hook calls
  const [step, setStep] = useState<Step>("region")
  const [regionCode, setRegionCode] = useState("AE")
  const [incomeType, setIncomeType] = useState<IncomeType>("freelancer")
  const [isMuslim, setIsMuslim] = useState(false)
  const [monthlyExpenses, setMonthlyExpenses] = useState("")
  const [savingsBalance, setSavingsBalance] = useState("")
  const [saving, setSaving] = useState(false)
  const [autoSigningIn, setAutoSigningIn] = useState(false)

  const profile = TAX_PROFILES[regionCode]
  const isGCC = ["AE", "SA", "QA", "KW", "BH", "OM"].includes(regionCode)
  const steps: Step[] = ["region", "income_type", ...(isGCC ? ["religion" as Step] : []), "expenses", "savings"]
  const currentIdx = steps.indexOf(step)
  const progress = ((currentIdx + 1) / steps.length) * 100

  // Auto sign-in anonymously if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated" && !autoSigningIn) {
      setAutoSigningIn(true)
      let userId = ""
      try {
        userId = localStorage.getItem("keel_anonymous_id") || ""
        if (!userId) {
          userId = `anon_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
          localStorage.setItem("keel_anonymous_id", userId)
        }
      } catch {}
      signIn("anonymous", { userId, redirect: false }).catch(() => {})
    }
  }, [status, autoSigningIn])

  if (status === "loading" || autoSigningIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Setting up your account…</span>
        </div>
      </div>
    )
  }

  const next = () => {
    const nextIdx = currentIdx + 1
    if (nextIdx < steps.length) setStep(steps[nextIdx])
    else handleSubmit()
  }
  const back = () => {
    if (currentIdx > 0) setStep(steps[currentIdx - 1])
  }

  const handleSubmit = async () => {
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
        onboardingComplete: true,
      }),
    })
    router.push("/dashboard")
  }

  const STEP_TITLES: Record<Step, string> = {
    region: "Where do you live?",
    income_type: "How do you earn?",
    religion: "Zakat tracking?",
    expenses: "Monthly expenses?",
    savings: "Current savings?",
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-5 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
            <Anchor className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg text-slate-900 tracking-tight">Keel</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Step {currentIdx + 1} of {steps.length}</span>
          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-1.5 bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900">{STEP_TITLES[step]}</h1>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

            {/* Region */}
            {step === "region" && (
              <div>
                <p className="text-sm text-slate-500 mb-4">We set your tax reserve % automatically. Everything is an estimate — not tax advice.</p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {REGIONS.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => setRegionCode(r.code)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                        regionCode === r.code
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xl w-7 text-center">{r.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{r.region}</p>
                        {TAX_PROFILES[r.code] && (
                          <p className="text-xs text-slate-400">Reserve ~{TAX_PROFILES[r.code].reservePercent}% per payment</p>
                        )}
                      </div>
                      {regionCode === r.code && (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Income type */}
            {step === "income_type" && (
              <div>
                <p className="text-sm text-slate-500 mb-4">Pick what best describes your work.</p>
                <div className="grid grid-cols-2 gap-3">
                  {INCOME_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setIncomeType(t)}
                      className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
                        incomeType === t
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-2xl mb-2">{INCOME_LABELS[t].icon}</span>
                      <p className="text-sm font-black text-slate-900">{INCOME_TYPE_LABELS[t]}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{INCOME_LABELS[t].sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Religion / Zakat */}
            {step === "religion" && (
              <div>
                <p className="text-sm text-slate-500 mb-4">If you are Muslim, Keel tracks your Zakat obligation (2.5% on eligible savings). Optional and private.</p>
                <div className="space-y-3">
                  {[
                    { val: true, label: "Yes, track my Zakat", sub: "Auto-calculate Zakat liability", icon: "☪️" },
                    { val: false, label: "Skip Zakat tracking", sub: "Tax and VAT planning only", icon: "→" },
                  ].map((opt) => (
                    <button
                      key={String(opt.val)}
                      onClick={() => setIsMuslim(opt.val)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        isMuslim === opt.val
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{opt.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Expenses */}
            {step === "expenses" && (
              <div>
                <p className="text-sm text-slate-500 mb-4">Rent, food, bills, subscriptions — everything you spend monthly. Estimate is fine.</p>
                <div className="relative mb-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{profile?.currencySymbol ?? "$"}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={monthlyExpenses}
                    onChange={(e) => setMonthlyExpenses(e.target.value)}
                    placeholder="3500"
                    className="w-full pl-10 pr-4 py-4 text-2xl font-black border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-400">Powers your runway calculator. Update anytime in settings.</p>
              </div>
            )}

            {/* Savings */}
            {step === "savings" && (
              <div>
                <p className="text-sm text-slate-500 mb-4">How much do you have saved right now? Rough estimate is fine — update anytime in settings.</p>
                <div className="relative mb-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{profile?.currencySymbol ?? "$"}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={savingsBalance}
                    onChange={(e) => setSavingsBalance(e.target.value)}
                    placeholder="10000"
                    className="w-full pl-10 pr-4 py-4 text-2xl font-black border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-400">Used to calculate your runway</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between mt-5">
            {currentIdx > 0 ? (
              <button
                onClick={back}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}
            <button
              onClick={next}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-7 py-3 rounded-xl transition-colors shadow-sm shadow-emerald-100"
            >
              {currentIdx === steps.length - 1
                ? saving ? "Setting up…" : "Go to dashboard"
                : "Continue"}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
