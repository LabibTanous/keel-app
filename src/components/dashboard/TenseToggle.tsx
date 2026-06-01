"use client"

import { motion } from "framer-motion"

const PINE = "#1F4D3A"
const BG = "#EBE6DA"

interface Props {
  active: "forward" | "back"
  onChange: (v: "forward" | "back") => void
}

export default function TenseToggle({ active, onChange }: Props) {
  const tabs: { key: "forward" | "back"; label: string }[] = [
    { key: "forward", label: "Spending" },
    { key: "back", label: "Spent" },
  ]

  return (
    <div className="relative flex rounded-xl p-1 gap-1" style={{ background: BG }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="relative flex-1 py-2 text-sm font-bold rounded-lg z-10 transition-colors"
          style={{ color: active === tab.key ? "white" : PINE }}
        >
          {active === tab.key && (
            <motion.div
              layoutId="tense-toggle"
              className="absolute inset-0 rounded-lg z-[-1]"
              style={{ background: PINE }}
              transition={{ type: "spring", duration: 0.4 }}
            />
          )}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
