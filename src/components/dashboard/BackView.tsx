"use client"

import { TrendingUp } from "lucide-react"

const INK = "#1A201C"
const PINE = "#1F4D3A"
const SURFACE = "#FBFAF5"
const BG = "#EBE6DA"

interface Entry {
  id: string
  source: string
  amount: number
  date: string
}

interface Props {
  entries: Entry[]
  currency: string
}

export default function BackView({ entries, currency }: Props) {
  const fmt = (n: number) => `${currency} ${Math.round(n).toLocaleString("en-US")}`

  if (entries.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: BG }}>
          <TrendingUp className="w-6 h-6" style={{ color: PINE, opacity: 0.4 }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: INK, opacity: 0.5 }}>No income logged yet</p>
        <p className="text-xs mt-1" style={{ color: INK, opacity: 0.35 }}>Log income as you receive it</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: SURFACE }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: `${INK}10` }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: PINE, opacity: 0.6 }}>
          Recent income
        </p>
      </div>
      <div className="divide-y" style={{ borderColor: `${INK}08` }}>
        {entries.map(e => (
          <div key={e.id} className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: BG }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: PINE }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: INK }}>{e.source}</p>
                <p className="text-xs" style={{ color: INK, opacity: 0.45 }}>
                  {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
            <p className="text-sm font-black" style={{ color: PINE }}>{fmt(e.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
