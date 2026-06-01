"use client"

const PINE = "#1F4D3A"
const CLAY = "#C16A3B"
const GOLD = "#A6822F"
const MINT = "#2FA374"
const INK = "#1A201C"

interface Props {
  low: number
  typicalLow: number
  likely: number
  typicalHigh: number
  high: number
  paycheck: number
  currency: string
}

export default function IncomeRange({ low, typicalLow, likely, typicalHigh, high, paycheck, currency }: Props) {
  const fmt = (n: number) => `${currency} ${Math.round(n).toLocaleString("en-US")}`
  const span = high - low || 1

  const pct = (v: number) => Math.round(((v - low) / span) * 100)

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: PINE, opacity: 0.6 }}>
        Next month range
      </p>

      {/* Range bar */}
      <div className="relative h-3 rounded-full overflow-visible" style={{ background: `${INK}12` }}>
        {/* Typical band */}
        <div
          className="absolute top-0 bottom-0 rounded-full"
          style={{
            left: `${pct(typicalLow)}%`,
            width: `${pct(typicalHigh) - pct(typicalLow)}%`,
            background: `${MINT}44`,
          }}
        />
        {/* Paycheck marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow"
          style={{ left: `${pct(paycheck)}%`, background: CLAY, transform: "translate(-50%,-50%)" }}
        />
        {/* Likely marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow"
          style={{ left: `${pct(likely)}%`, background: PINE, transform: "translate(-50%,-50%)" }}
        />
      </div>

      {/* Labels row */}
      <div className="grid grid-cols-3 text-xs">
        <div>
          <p className="font-semibold" style={{ color: CLAY }}>Lean</p>
          <p className="opacity-60" style={{ color: INK }}>{fmt(low)}</p>
        </div>
        <div className="text-center">
          <p className="font-semibold" style={{ color: PINE }}>Likely</p>
          <p className="opacity-60" style={{ color: INK }}>{fmt(likely)}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold" style={{ color: GOLD }}>Strong</p>
          <p className="opacity-60" style={{ color: INK }}>{fmt(high)}</p>
        </div>
      </div>

      {/* Paycheck note */}
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: CLAY, flexShrink: 0 }} />
        <span style={{ color: INK, opacity: 0.7 }}>
          Your paycheck ({fmt(paycheck)}) sits {paycheck <= likely ? "at or below" : "above"} the typical mid-point
        </span>
      </div>
    </div>
  )
}
