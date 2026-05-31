"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface DockItem {
  icon: LucideIcon
  label: string
  onClick?: () => void
  active?: boolean
}

interface DockProps {
  className?: string
  items: DockItem[]
}

interface DockIconButtonProps extends DockItem {
  className?: string
}

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
  ({ icon: Icon, label, onClick, active, className }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.15, y: -3 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative group flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
        active
          ? "text-emerald-600"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60",
        className
      )}
    >
      <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
      <span className="text-[10px] font-semibold">{label}</span>
      {/* Tooltip on desktop */}
      <span className={cn(
        "absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs",
        "bg-slate-900 text-white",
        "opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none",
        "hidden sm:block"
      )}>
        {label}
      </span>
    </motion.button>
  )
)
DockIconButton.displayName = "DockIconButton"

const Dock = React.forwardRef<HTMLDivElement, DockProps>(({ items, className }, ref) => (
  <div ref={ref} className={cn("flex items-center justify-center", className)}>
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "flex items-center gap-1 px-3 py-2 rounded-2xl",
        "bg-white/90 backdrop-blur-lg border border-slate-200",
        "shadow-lg shadow-slate-200/60"
      )}
    >
      {items.map((item) => (
        <DockIconButton key={item.label} {...item} />
      ))}
    </motion.nav>
  </div>
))
Dock.displayName = "Dock"

export { Dock }
export type { DockItem }
