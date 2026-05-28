"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { ChevronRight, ChevronLeft, Globe, Briefcase, DollarSign, Heart } from "lucide-react"
import { REGIONS, TAX_PROFILES } from "@/lib/tax-profiles"
import { INCOME_TYPE_LABELS, type IncomeType } from "@/types"

type Step = "region" | "income_type" | "religion" | "expenses" | "savings"

const INCOME_TYPES: IncomeType[] = [
  "freelancer", "gig_worker", "creator", "consultant", "business_owner", "mixed",
]

const INCOME_ICONS: Record<IncomeType, string> = {
  freelancer: "💻",
  gig_worker: "🚗",
  creator: "🎬",
  consultant: "📊",
  business_owner: "🏢",
  mixed: "🔀",
}

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  if (status === "unauthenticated") {
    if (typeof window !== "undefined") router.push("/")
    return null
  }

  const [step, setStep] = useState<Step>("region")
  const [regionCode, setRegionCode] = useState("US")
  const [incomeType, setIncomeType] = useState<IncomeType>("freelancer")
  const [isMuslim, setIsMuslim] = useState(false)
  const [monthlyExpenses, setMonthlyExpenses] = useState("")
  const [savingsBalance, setSavingsBalance] = useState("")
  const [saving, setSaving] = useState(false)

  const profile = TAX_PROFILES[regionCode]
  const isGCC = ["AE", "SA", "QA", "KW", "BH", "OM"].includes(regionCode)
  const steps: Step[] = ["region", "income_type", ...(isGCC ? ["religion" as Step] : []), "expenses", "savings"]
  const currentIdx = steps.indexOf(step)
  const progress = ((currentIdx + 1) / steps.length) * 100

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-keel-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-sm">K</span>
        </div>
        <span className="font-extrabold text-xl text-gray-900">Keel</span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Step {currentIdx + 1} of {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full">
          <div
            className="h-1.5 bg-keel-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        {/* Step: Region */}
        {step === "region" && (
          <div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Where do you live?</h2>
            <p className="text-gray-500 text-sm mb-6">
              We use this to set your tax reserve % automatically. Everything is an estimate — not tax advice.
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
              {REGIONS.map((r) => (
                <button
                  key={r.code}
                  onClick={() => setRegionCode(r.code)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    regionCode === r.code
                      ? "border-keel-500 bg-keel-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-2xl">{r.flag}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{r.region}</p>
                    {TAX_PROFILES[r.code] && (
                      <p className="text-xs text-gray-400">
                        Reserve ~{TAX_PROFILES[r.code].reservePercent}% per payment
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Income type */}
        {step === "income_type" && (
          <div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-5">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">How do you earn?</h2>
            <p className="text-gray-500 text-sm mb-6">Pick what best describes your work.</p>
            <div className="grid grid-cols-2 gap-3">
              {INCOME_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setIncomeType(t)}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
                    incomeType === t
                      ? "border-keel-500 bg-keel-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-2xl mb-2">{INCOME_ICONS[t]}</span>
                  <span className="text-sm font-semibold text-gray-900">{INCOME_TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Religion (GCC only) */}
        {step === "religion" && (
          <div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-5">
              <Heart className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Zakat tracking?</h2>
            <p className="text-gray-500 text-sm mb-6">
              If you are Muslim, Keel can track your Zakat obligation (2.5% of eligible savings held for one lunar year). This is optional and private.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setIsMuslim(true)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  isMuslim ? "border-keel-500 bg-keel-50" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <span className="text-2xl">☪️</span>
                <div>
                  <p className="font-semibold text-gray-900">Yes, track my Zakat</p>
                  <p className="text-xs text-gray-400">Keel will calculate your Zakat liability automatically</p>
                </div>
              </button>
              <button
                onClick={() => setIsMuslim(false)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  !isMuslim ? "border-keel-500 bg-keel-50" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <span className="text-2xl">⏭️</span>
                <div>
                  <p className="font-semibold text-gray-900">Skip Zakat tracking</p>
                  <p className="text-xs text-gray-400">Just tax and VAT planning</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step: Expenses */}
        {step === "expenses" && (
          <div>
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-5">
              <DollarSign className="w-6 h-6 text-rose-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Monthly expenses?</h2>
            <p className="text-gray-500 text-sm mb-6">
              Rent, food, bills, subscriptions — everything you spend in a typical month. Estimate is fine.
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-lg">
                {profile?.currencySymbol ?? "$"}
              </span>
              <input
                type="number"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(e.target.value)}
                placeholder="3500"
                className="w-full pl-10 pr-4 py-4 text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-keel-300 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">This powers your runway calculator.</p>
          </div>
        )}

        {/* Step: Savings */}
        {step === "savings" && (
          <div>
            <div className="w-12 h-12 bg-keel-50 rounded-xl flex items-center justify-center mb-5">
              <span className="text-2xl">🏦</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Current savings?</h2>
            <p className="text-gray-500 text-sm mb-6">
              How much do you have in savings right now? Used to calculate your runway.
              You can update this anytime.
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-lg">
                {profile?.currencySymbol ?? "$"}
              </span>
              <input
                type="number"
                value={savingsBalance}
                onChange={(e) => setSavingsBalance(e.target.value)}
                placeholder="10000"
                className="w-full pl-10 pr-4 py-4 text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-keel-300 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">Rough estimate is fine — just to get started.</p>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {currentIdx > 0 ? (
            <button
              onClick={back}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          <button
            onClick={next}
            disabled={saving}
            className="flex items-center gap-2 bg-keel-600 hover:bg-keel-700 disabled:opacity-50 text-white font-bold px-7 py-3 rounded-xl transition-colors ml-auto"
          >
            {currentIdx === steps.length - 1
              ? saving ? "Setting up..." : "Go to dashboard"
              : "Continue"}
            {!saving && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
