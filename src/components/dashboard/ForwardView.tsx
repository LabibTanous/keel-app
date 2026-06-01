"use client"

import { useRouter } from "next/navigation"
import { Settings2 } from "lucide-react"
import IncomeRange from "./IncomeRange"
import AllocationFlow from "./AllocationFlow"
import Signals from "./Signals"
import AffordCheck from "./AffordCheck"
import type { MonthlyPlan, Forecast, Signal } from "@/lib/engine"

const PINE = "#1F4D3A"
const INK = "#1A201C"
const SURFACE = "#FBFAF5"
const BG = "#EBE6DA"

interface Props {
  paycheck: number
  plan: MonthlyPlan
  forecast: Forecast
  signals: Signal[]
  currency: string
  hasZakat: boolean
  payZakat: boolean
}

export default function ForwardView({ paycheck, plan, forecast, signals, currency, hasZakat, payZakat }: Props) {
  const router = useRouter()
  const fmt = (n: number) => `${currency} ${Math.round(n).toLocaleString("en-US")}`

  return (
    <div className="space-y-5">
      {/* Hero paycheck card */}
      <div className="rounded-2xl p-6" style={{ background: PINE }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white opacity-60 mb-1">Steady paycheck</p>
            {paycheck > 0 ? (
              <p className="text-4xl font-black text-white">{fmt(paycheck)}</p>
            ) : (
              <p className="text-xl font-bold text-white opacity-60">Not set yet</p>
            )}
            <p className="text-xs text-white opacity-50 mt-1">
              {plan.runwayMonths < Infinity
                ? `${plan.runwayMonths} months runway`
                : "Set paycheck to see runway"}
            </p>
          </div>
          <button
            onClick={() => router.push("/paycheck")}
            className="shrink-0 p-2 rounded-xl text-white hover:opacity-80 transition-opacity"
            style={{ background: `rgba(255,255,255,0.15)` }}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
        {paycheck === 0 && (
          <button
            onClick={() => router.push("/paycheck")}
            className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white border-2 border-white border-opacity-30 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            Set my paycheck →
          </button>
        )}
      </div>

      {/* Income range */}
      {forecast.likely > 0 && (
        <div className="rounded-2xl p-5" style={{ background: SURFACE }}>
          <IncomeRange
            low={forecast.low}
            typicalLow={forecast.typicalLow}
            likely={forecast.likely}
            typicalHigh={forecast.typicalHigh}
            high={forecast.high}
            paycheck={paycheck}
            currency={currency}
          />
        </div>
      )}

      {/* No income state */}
      {forecast.likely === 0 && (
        <div className="rounded-2xl p-5 text-center" style={{ background: SURFACE }}>
          <p className="text-sm font-semibold" style={{ color: INK, opacity: 0.5 }}>No income data yet</p>
          <p className="text-xs mt-1" style={{ color: INK, opacity: 0.35 }}>Log a few payments to see your income range</p>
        </div>
      )}

      {/* Allocation flow */}
      {paycheck > 0 && (
        <div className="rounded-2xl p-5" style={{ background: SURFACE }}>
          <AllocationFlow
            paycheck={paycheck}
            tax={plan.offTheTop.tax}
            zakat={plan.offTheTop.zakat}
            goal={plan.offTheTop.goal}
            essentials={plan.paycheckBreakdown.essentials}
            freeToSpend={plan.paycheckBreakdown.freeToSpend}
            currency={currency}
            payZakat={payZakat}
            hasZakat={hasZakat}
          />
        </div>
      )}

      {/* Signals */}
      {signals.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: SURFACE }}>
          <Signals signals={signals} />
        </div>
      )}

      {/* Afford check */}
      {paycheck > 0 && (
        <div className="rounded-2xl p-5" style={{ background: SURFACE }}>
          <AffordCheck
            freeToSpend={plan.paycheckBreakdown.freeToSpend}
            buffer={plan.bufferBalance}
            currency={currency}
          />
        </div>
      )}

      {/* Goal prompt */}
      <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: BG }}>
        <div>
          <p className="text-sm font-bold" style={{ color: INK }}>Goal set?</p>
          <p className="text-xs opacity-50" style={{ color: INK }}>Track a savings target with a monthly contribution</p>
        </div>
        <button
          onClick={() => router.push("/goal")}
          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
          style={{ background: PINE }}
        >
          Set goal
        </button>
      </div>
    </div>
  )
}
