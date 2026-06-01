"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Anchor, ChevronLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { simulateBuffer, monthLabel } from "@/lib/engine"
import type { IncomeStats, MonthlyPlan, PaycheckRecommendation, Forecast } from "@/lib/engine"

// ─── Palette ──────────────────────────────────────────────────────────────────
const BG = "#EBE6DA"
const SURFACE = "#FBFAF5"
const INK = "#1A201C"
const PINE = "#1F4D3A"
const CLAY = "#C16A3B"
const GOLD = "#A6822F"
const MINT = "#2FA374"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Charts({ stats, paycheck, buffer }: { stats: IncomeStats; paycheck: number; buffer: number }) {
  const [RC, setRC] = useState<typeof import("recharts") | null>(null)
  useEffect(() => {
    import("recharts").then(setRC)
  }, [])
  if (!RC || stats.monthsAnalyzed === 0) return null

  const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line, CartesianGrid } = RC

  const barData = stats.monthlyTotals.map(m => ({
    name: monthLabel(m.month),
    income: m.total,
  }))

  const simData = simulateBuffer(stats.monthlyTotals, paycheck, buffer).map(r => ({
    name: monthLabel(r.month),
    buffer: r.buffer,
    income: r.income,
  }))

  return (
    <div className="space-y-6">
      {/* Income bar chart */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: PINE, opacity: 0.7 }}>
          Monthly income — last {stats.monthsAnalyzed} months
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: INK }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: INK }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: SURFACE, border: `1px solid ${PINE}22`, borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [Number(v).toLocaleString(), "Income"]}
            />
            <ReferenceLine y={paycheck} stroke={CLAY} strokeDasharray="4 3" strokeWidth={2} label={{ value: "paycheck", position: "insideTopRight", fill: CLAY, fontSize: 10 }} />
            <Bar dataKey="income" fill={MINT} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Buffer simulation line chart */}
      {simData.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: PINE, opacity: 0.7 }}>
            Buffer simulation at this paycheck
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={simData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${PINE}18`} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: INK }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: INK }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: SURFACE, border: `1px solid ${PINE}22`, borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [Number(v).toLocaleString(), "Buffer"]}
              />
              <ReferenceLine y={0} stroke={CLAY} strokeWidth={1} />
              <Line type="monotone" dataKey="buffer" stroke={PINE} strokeWidth={2.5} dot={{ fill: PINE, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── Band helper ──────────────────────────────────────────────────────────────
function getBand(wage: number, essentials: number, median: number, likely: number) {
  if (wage < essentials) return { key: "under", label: "Below essentials", color: CLAY }
  if (wage < median * 0.85) return { key: "safe", label: "Safer", color: MINT }
  if (wage <= median) return { key: "balanced", label: "Balanced", color: PINE }
  if (wage <= likely) return { key: "roomier", label: "Roomier", color: GOLD }
  return { key: "stretched", label: "Stretched", color: CLAY }
}

// ─── Disclaimer ───────────────────────────────────────────────────────────────
function Disclaimer() {
  return (
    <p className="text-xs mt-2" style={{ color: INK, opacity: 0.45 }}>
      Estimates only — not financial or tax advice. Consult a qualified accountant for your obligations.
    </p>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
interface PlanData {
  stats: IncomeStats
  recommendation: PaycheckRecommendation
  plan: MonthlyPlan
  forecast: Forecast
  paycheck: number
  tax: { reservePercent: number; currency: string; currencySymbol: string }
}

export default function PaycheckPage() {
  const router = useRouter()
  const [data, setData] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wage, setWage] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/plan")
      .then(r => {
        if (!r.ok) throw new Error("Failed to load plan")
        return r.json()
      })
      .then((d: PlanData) => {
        setData(d)
        setWage(d.paycheck || d.recommendation.amount || 0)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paycheckAmount: wage }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }, [wage])

  const fmt = (n: number) => {
    const sym = data?.tax?.currencySymbol ?? "AED"
    return `${sym} ${Math.round(n).toLocaleString("en-US")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: PINE }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <p className="text-sm" style={{ color: CLAY }}>{error ?? "Something went wrong"}</p>
      </div>
    )
  }

  const { stats, recommendation, plan, forecast } = data
  const band = getBand(wage, plan.paycheckBreakdown.essentials + plan.paycheckBreakdown.freeToSpend, stats.median, forecast.likely)
  const simAtWage = simulateBuffer(stats.monthlyTotals, wage, plan.bufferBalance)
  const wouldDip = simAtWage.some(r => r.buffer < 0)

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b" style={{ background: SURFACE, borderColor: `${PINE}18` }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity">
            <ChevronLeft className="w-5 h-5" style={{ color: INK }} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: PINE }}>
            <Anchor className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-base tracking-tight" style={{ color: INK }}>Paycheck</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">

        {/* Hero: current wage */}
        <div className="rounded-2xl p-6" style={{ background: PINE }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-white opacity-60 mb-1">Steady paycheck</p>
          <p className="text-4xl font-black text-white">{fmt(wage)}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${band.color}33`, color: band.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: band.color }} />
            {band.label}
          </div>
          <Disclaimer />
        </div>

        {/* Slider */}
        {stats.monthsAnalyzed > 0 && (
          <div className="rounded-2xl p-5" style={{ background: SURFACE }}>
            <div className="flex justify-between text-xs mb-2 font-semibold" style={{ color: INK, opacity: 0.6 }}>
              <span>{fmt(stats.min)}</span>
              <span className="font-black" style={{ color: PINE }}>{fmt(wage)}</span>
              <span>{fmt(stats.max)}</span>
            </div>
            <input
              type="range"
              min={Math.max(0, stats.min)}
              max={Math.ceil(stats.max * 1.1)}
              step={250}
              value={wage}
              onChange={e => setWage(Number(e.target.value))}
              className="w-full accent-pine"
              style={{ accentColor: PINE }}
            />
            <div className="flex justify-between text-[10px] mt-1 opacity-40" style={{ color: INK }}>
              <span>Lean</span>
              <span>Median {fmt(stats.median)}</span>
              <span>Max</span>
            </div>
            {wouldDip && (
              <div className="mt-3 flex items-start gap-2 text-xs p-3 rounded-xl" style={{ background: `${CLAY}18`, color: CLAY }}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Buffer would dip below zero on this paycheck — lean months could be tight.
              </div>
            )}
          </div>
        )}

        {/* Engine recommendation */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: SURFACE }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: INK }}>Keel's recommendation</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
              background: recommendation.confidence === 'high' ? `${MINT}22` : recommendation.confidence === 'medium' ? `${GOLD}22` : `${CLAY}22`,
              color: recommendation.confidence === 'high' ? MINT : recommendation.confidence === 'medium' ? GOLD : CLAY,
            }}>
              {recommendation.confidence} confidence
            </span>
          </div>
          <p className="text-3xl font-black" style={{ color: PINE }}>{fmt(recommendation.amount)}</p>
          <p className="text-sm leading-relaxed" style={{ color: INK, opacity: 0.75 }}>{recommendation.rationale}</p>
          {!recommendation.coversEssentials && recommendation.amount > 0 && (
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl" style={{ background: `${CLAY}14`, color: CLAY }}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Below essentials — income may need to grow before a steady wage is viable.
            </div>
          )}
          {stats.monthsAnalyzed === 0 && (
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl" style={{ background: `${GOLD}14`, color: GOLD }}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Log a few months of income first — the engine needs data to calibrate.
            </div>
          )}
          <button
            onClick={() => setWage(recommendation.amount)}
            className="text-xs font-semibold underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: PINE }}
          >
            Use this amount →
          </button>
        </div>

        {/* Charts */}
        {stats.monthsAnalyzed > 0 && (
          <div className="rounded-2xl p-5" style={{ background: SURFACE }}>
            <Charts stats={stats} paycheck={wage} buffer={plan.bufferBalance} />
          </div>
        )}

        {/* Plan breakdown */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: SURFACE }}>
          <p className="text-sm font-bold" style={{ color: INK }}>At {fmt(wage)} / month</p>
          {[
            { label: "Essentials", value: fmt(Math.min(plan.paycheckBreakdown.essentials, wage)), note: "fixed costs" },
            { label: "Free to spend", value: fmt(Math.max(0, wage - plan.paycheckBreakdown.essentials)), note: "yours to use" },
            { label: "Tax reserve (est.)", value: `${data.tax.reservePercent}% off income`, note: "estimate only" },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: INK }}>{row.label}</p>
                <p className="text-xs opacity-50" style={{ color: INK }}>{row.note}</p>
              </div>
              <p className="text-sm font-black" style={{ color: PINE }}>{row.value}</p>
            </div>
          ))}
          <Disclaimer />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || wage === 0}
          className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
          style={{ background: saved ? MINT : PINE }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
          {saved ? "Saved!" : saving ? "Saving…" : `Use ${fmt(wage)} as my paycheck`}
        </button>
      </div>
    </div>
  )
}
