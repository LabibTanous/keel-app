"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Anchor, Loader2, CheckCircle2, Target } from "lucide-react"

const BG = "#EBE6DA"
const SURFACE = "#FBFAF5"
const INK = "#1A201C"
const PINE = "#1F4D3A"
const MINT = "#2FA374"
const GOLD = "#A6822F"
const CLAY = "#C16A3B"

// ─── Dynamic Recharts ─────────────────────────────────────────────────────────
function GoalTrajectory({ current, target, monthly }: { current: number; target: number; monthly: number }) {
  const [RC, setRC] = useState<typeof import("recharts") | null>(null)
  useEffect(() => { import("recharts").then(setRC) }, [])
  if (!RC || monthly <= 0 || target <= 0) return null

  const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } = RC

  const months = Math.ceil((target - current) / monthly)
  const data = Array.from({ length: Math.min(months + 1, 37) }, (_, i) => ({
    month: i === 0 ? "Now" : `M${i}`,
    balance: Math.min(current + monthly * i, target),
  }))

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: PINE, opacity: 0.6 }}>
        Projected trajectory
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={MINT} stopOpacity={0.35} />
              <stop offset="95%" stopColor={MINT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: INK }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: INK }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: SURFACE, border: `1px solid ${PINE}22`, borderRadius: 8, fontSize: 12 }}
            formatter={(v) => [Number(v).toLocaleString(), "Saved"]}
          />
          <ReferenceLine y={target} stroke={GOLD} strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Goal", position: "insideTopRight", fill: GOLD, fontSize: 10 }} />
          <Area type="monotone" dataKey="balance" stroke={MINT} strokeWidth={2.5} fill="url(#goalGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      {months <= 36 && (
        <p className="text-xs mt-2 font-semibold" style={{ color: PINE }}>
          At {monthly.toLocaleString("en-US")}/mo → target reached in ~{months} month{months !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GoalPage() {
  const router = useRouter()
  const [goalName, setGoalName] = useState("")
  const [goalTarget, setGoalTarget] = useState("")
  const [goalCurrent, setGoalCurrent] = useState("")
  const [goalMonthly, setGoalMonthly] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load existing goal from user profile
  useEffect(() => {
    fetch("/api/user")
      .then(r => r.json())
      .then(d => {
        const u = d.user
        if (u?.goal_name) setGoalName(u.goal_name)
        if (u?.goal_target != null) setGoalTarget(String(u.goal_target))
        if (u?.goal_current != null) setGoalCurrent(String(u.goal_current))
        if (u?.goal_monthly != null) setGoalMonthly(String(u.goal_monthly))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch("/api/goal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalName: goalName || null,
        goalTarget: goalTarget ? Number(goalTarget) : null,
        goalCurrent: goalCurrent ? Number(goalCurrent) : null,
        goalMonthly: goalMonthly ? Number(goalMonthly) : null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const pct = goalTarget && goalCurrent
    ? Math.min(Math.round((Number(goalCurrent) / Number(goalTarget)) * 100), 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: PINE }} />
      </div>
    )
  }

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
          <span className="font-black text-base tracking-tight" style={{ color: INK }}>Set a Goal</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">

        {/* Progress if goal already set */}
        {goalTarget && Number(goalTarget) > 0 && (
          <div className="rounded-2xl p-5" style={{ background: PINE }}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-white opacity-70" />
              <p className="text-xs font-semibold uppercase tracking-wider text-white opacity-60">
                {goalName || "Your goal"}
              </p>
            </div>
            <p className="text-4xl font-black text-white">{pct}%</p>
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: `rgba(255,255,255,0.2)` }}>
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: MINT }}
              />
            </div>
            <p className="text-xs text-white opacity-50 mt-2">
              {Number(goalCurrent || 0).toLocaleString("en-US")} of {Number(goalTarget).toLocaleString("en-US")} saved
            </p>
          </div>
        )}

        {/* Form */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: SURFACE }}>
          <p className="text-sm font-bold" style={{ color: INK }}>Goal details</p>

          {[
            { label: "Goal name", placeholder: "Emergency fund · Car · Trip to Japan", value: goalName, set: setGoalName, type: "text" },
            { label: "Target amount", placeholder: "20 000", value: goalTarget, set: setGoalTarget, type: "number" },
            { label: "Already saved", placeholder: "0", value: goalCurrent, set: setGoalCurrent, type: "number" },
            { label: "Monthly contribution", placeholder: "1 000", value: goalMonthly, set: setGoalMonthly, type: "number" },
          ].map(({ label, placeholder, value, set, type }) => (
            <div key={label}>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: INK, opacity: 0.5 }}>
                {label}
              </label>
              <input
                type={type}
                inputMode={type === "number" ? "numeric" : undefined}
                value={value}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2"
                style={{ background: BG, color: INK, border: `1.5px solid ${PINE}22` }}
              />
            </div>
          ))}

          <p className="text-[11px] pt-1" style={{ color: INK, opacity: 0.4 }}>
            Estimates only — not financial advice. Contributions aren't enforced; use this as a personal planning target.
          </p>
        </div>

        {/* Trajectory chart */}
        {goalTarget && goalMonthly && Number(goalTarget) > 0 && Number(goalMonthly) > 0 && (
          <div className="rounded-2xl p-5" style={{ background: SURFACE }}>
            <GoalTrajectory
              current={Number(goalCurrent || 0)}
              target={Number(goalTarget)}
              monthly={Number(goalMonthly)}
            />
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || (!goalName && !goalTarget)}
          className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
          style={{ background: saved ? MINT : PINE }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
          {saved ? "Saved!" : saving ? "Saving…" : "Save goal"}
        </button>

        {/* Back to dashboard */}
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full py-3 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-70"
          style={{ color: PINE }}
        >
          ← Back to dashboard
        </button>
      </div>
    </div>
  )
}
