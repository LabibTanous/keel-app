"use client"

import { useState } from "react"
import { CheckCircle2, AlertTriangle, X } from "lucide-react"
import { canAfford } from "@/lib/engine"
import type { AffordResult } from "@/lib/engine"

const PINE = "#1F4D3A"
const CLAY = "#C16A3B"
const GOLD = "#A6822F"
const MINT = "#2FA374"
const INK = "#1A201C"
const BG = "#EBE6DA"

interface Props {
  freeToSpend: number
  buffer: number
  currency: string
}

const VERDICT_CONFIG = {
  fits: { Icon: CheckCircle2, color: MINT, label: "Fits the plan" },
  tight: { Icon: AlertTriangle, color: GOLD, label: "Dips into buffer" },
  breaks: { Icon: X, color: CLAY, label: "Would break the plan" },
}

export default function AffordCheck({ freeToSpend, buffer, currency }: Props) {
  const [amount, setAmount] = useState("")
  const [result, setResult] = useState<AffordResult | null>(null)

  const check = () => {
    const cost = Number(amount)
    if (!cost || cost <= 0) return
    setResult(canAfford(cost, freeToSpend, buffer))
  }

  const verdict = result ? VERDICT_CONFIG[result.verdict] : null

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: PINE, opacity: 0.6 }}>
        Can I afford this?
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
            style={{ color: INK, opacity: 0.5 }}
          >
            {currency}
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={e => { setAmount(e.target.value); setResult(null) }}
            placeholder="2 500"
            className="w-full pl-12 pr-3 py-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2"
            style={{
              background: BG,
              color: INK,
              border: `1.5px solid ${PINE}22`,
            }}
          />
        </div>
        <button
          onClick={check}
          className="px-4 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-80"
          style={{ background: PINE }}
        >
          Check
        </button>
      </div>

      {result && verdict && (
        <div className="rounded-xl p-3.5" style={{ background: `${verdict.color}14` }}>
          <div className="flex items-center gap-2 mb-1">
            <verdict.Icon className="w-4 h-4" style={{ color: verdict.color }} />
            <p className="text-sm font-black" style={{ color: verdict.color }}>{verdict.label}</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: INK, opacity: 0.75 }}>{result.reason}</p>
          {result.freeRemaining > 0 && (
            <p className="text-xs mt-1.5 font-semibold" style={{ color: PINE }}>
              {currency} {Math.round(result.freeRemaining).toLocaleString("en-US")} free-to-spend remains
            </p>
          )}
        </div>
      )}
    </div>
  )
}
