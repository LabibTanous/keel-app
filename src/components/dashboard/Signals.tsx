"use client"

import { AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react"
import type { Signal } from "@/lib/engine"

const CLAY = "#C16A3B"
const GOLD = "#A6822F"
const MINT = "#2FA374"
const INK = "#1A201C"

const KIND_CONFIG = {
  warning: { Icon: AlertTriangle, color: CLAY, bg: `${CLAY}14` },
  tip: { Icon: Lightbulb, color: GOLD, bg: `${GOLD}14` },
  success: { Icon: CheckCircle2, color: MINT, bg: `${MINT}14` },
}

interface Props {
  signals: Signal[]
}

export default function Signals({ signals }: Props) {
  if (signals.length === 0) return null
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#1F4D3A", opacity: 0.6 }}>
        Signals
      </p>
      {signals.map((s, i) => {
        const { Icon, color, bg } = KIND_CONFIG[s.kind]
        return (
          <div key={i} className="rounded-xl p-3.5" style={{ background: bg }}>
            <div className="flex items-start gap-2.5">
              <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color }} />
              <div>
                <p className="text-sm font-bold" style={{ color: INK }}>{s.title}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: INK, opacity: 0.7 }}>{s.detail}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
