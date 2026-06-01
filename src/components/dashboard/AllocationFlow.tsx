"use client"

const PINE = "#1F4D3A"
const CLAY = "#C16A3B"
const GOLD = "#A6822F"
const MINT = "#2FA374"
const INK = "#1A201C"

interface Props {
  paycheck: number
  tax: number
  zakat: number
  goal: number
  essentials: number
  freeToSpend: number
  currency: string
  payZakat: boolean
  hasZakat: boolean
}

function FlowRow({ label, amount, note, color, currency }: { label: string; amount: number; note?: string; color: string; currency: string }) {
  const fmt = (n: number) => `${currency} ${Math.round(n).toLocaleString("en-US")}`
  return (
    <div className="flex items-center gap-3">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: INK }}>{label}</p>
        {note && <p className="text-[11px] opacity-50" style={{ color: INK }}>{note}</p>}
      </div>
      <p className="text-sm font-black" style={{ color }}>{fmt(amount)}</p>
    </div>
  )
}

export default function AllocationFlow({ paycheck, tax, zakat, goal, essentials, freeToSpend, currency, payZakat, hasZakat }: Props) {
  const showZakat = payZakat && hasZakat && zakat > 0
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: PINE, opacity: 0.6 }}>
        Where {currency} {Math.round(paycheck).toLocaleString("en-US")} goes
      </p>
      <FlowRow label="Tax reserve" amount={tax} note="Estimate only — not advice" color={CLAY} currency={currency} />
      {showZakat && (
        <FlowRow label="Zakat set-aside" amount={zakat} note="2.5% estimate" color={GOLD} currency={currency} />
      )}
      {goal > 0 && (
        <FlowRow label="Goal contribution" amount={goal} color={MINT} currency={currency} />
      )}
      <div className="my-1 border-t" style={{ borderColor: `${INK}12` }} />
      <FlowRow label="Essentials" amount={essentials} note="rent, bills, fixed costs" color={PINE} currency={currency} />
      <FlowRow label="Free to spend" amount={freeToSpend} note="yours to use freely" color={MINT} currency={currency} />
      <p className="text-[10px] mt-1 opacity-40" style={{ color: INK }}>
        Tax and Zakat figures are estimates only — not financial or tax advice.
      </p>
    </div>
  )
}
