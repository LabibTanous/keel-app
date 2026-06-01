# Keel Build Log

## Phase 1 — DB Migration (COMPLETE)
- Written: `supabase/migrations/001_engine_columns.sql`
- Adds: `paycheck_amount`, `goal_name`, `goal_target`, `goal_current`, `goal_monthly` to `keel_users`
- Adds: `currency` column to `keel_income_entries`
- **User must run this SQL in Supabase dashboard**

## Phase 2 — Engine + FX (COMPLETE)
- Written: `src/lib/engine.ts` — pure finance brain, zero DB/network access
- Written: `src/lib/fx.ts` — FX rates and format helpers (approximate, marked as such)
- Updated: `src/lib/tax-profiles.ts` — replaced with simplified TaxProfile matching engine types; kept backwards-compat exports (`REGIONS`, `calculateReserve`) for existing onboarding/profile pages

## Phase 3 — DB Layer Update (COMPLETE)
- Updated: `src/lib/db.ts`
  - Added `rowToUserProfile()` — maps DB column names to engine `UserProfile`
  - Added `rowToIncomeEntry()` — maps DB rows to engine `IncomeEntry`
  - Added `getOrSetPaycheck()` — read/write `paycheck_amount`
  - Added `updateGoal()` — write goal fields
  - Updated `addIncomeEntry()` — accepts optional `currency` field
  - Updated `updateUserProfile()` — accepts optional `paycheckAmount`

## Phase 4 — Plan API (COMPLETE)
- Written: `src/app/api/plan/route.ts`
- GET endpoint: returns `{ stats, recommendation, plan, signals, forecast, paycheck, tax }`
- All math delegated to engine; DB access only in route handler
- Handles empty income state gracefully

## Phase 5 — Paycheck Page (COMPLETE)
- Written: `src/app/paycheck/page.tsx`
- Income BarChart + paycheck ReferenceLine (recharts, dynamic import)
- Buffer simulation LineChart with live slider drag
- Band labels: Below essentials / Safer / Balanced / Roomier / Stretched
- "Use this paycheck" PATCH to `/api/user`
- Disclaimer on all tax/estimate figures

## Phase 6 — Dashboard Overhaul (COMPLETE)
- Replaced `DashboardClient.tsx` with new `DashboardShell.tsx` + component tree
- Components in `src/components/dashboard/`:
  - `TenseToggle.tsx` — Spent/Spending framer-motion toggle
  - `ForwardView.tsx` — plan view: paycheck hero, income range, allocation flow, signals, afford check
  - `BackView.tsx` — expense list, flat/muted
  - `IncomeRange.tsx` — honest lean/likely/strong range bar
  - `AllocationFlow.tsx` — tax → zakat → goal → essentials → free (vertical flow)
  - `Signals.tsx` — engine signals (warnings first)
  - `AffordCheck.tsx` — fits/tight/breaks verdict
- Dashboard page updated to use engine functions; old finance.ts functions deprecated

## Phase 7 — Goal Page + Polish (COMPLETE)
- Written: `src/app/goal/page.tsx` — form + GoalTrajectory AreaChart
- Written: `src/app/api/goal/route.ts` — PATCH to save goal fields
- Disclaimer on all goal estimates
- Empty states wired in all views
- Engine never called with DB/network access (verified)

## Build Status
- `npm run build` — PASSES (TypeScript clean, 14 routes)
- Fixed errors: invalid CSS properties, recharts Formatter types
