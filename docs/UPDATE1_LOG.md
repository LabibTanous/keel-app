# Update 1 — Foundation Fixes Log

## Fix 1 — Volatility-scaled paycheck
**Changed:** `src/lib/engine.ts` → `computePaycheck`
Replaced body with volatility-aware formula. Spread between lean and strong relative to likely
sets a safety factor (0.85 steady → 0.55 choppy). Demo seed result: 14,250 → **9,750**. Signature unchanged.

Deprecated functions (`recommendPaycheck`, `buildMonthlyPlan`, `detectSignalsLegacy`,
`forecastNextMonth`, `analyzeIncome`, `UserProfile`, `IncomeEntry`, `TaxProfile`) — **kept**.
`src/app/api/plan/route.ts` and `src/lib/db.ts` still import them. Deleting would break the build.

## Fix 2 — Prorated outlook
**Changed:** `src/lib/engine.ts` → `computeOutlook` (new `fractionElapsed` parameter)
**Changed:** `src/lib/engine.ts` → `detectSignals` (new `fractionElapsed` parameter, passed through)
**Changed:** `src/lib/store.ts` → `computePlan` (computes `fractionElapsed`, passes to both)
Early-month income is now compared against the prorated share of a likely month, not the full month.
Day 3 of the month no longer reads as "running lean."

## Fix 3 — Real AI adviser
**Created:** `src/app/api/assistant/route.ts` — server-side Anthropic proxy.
Uses `ANTHROPIC_API_KEY` env var. Returns 503 if not configured; graceful static fallback.
Model: `claude-sonnet-4-20250514`, max 400 tokens.
First message stripped if assistant (Anthropic requires user-first).

**Changed:** `src/components/keel/Assistant.tsx`
- Removed `window.claude?.complete` path and `declare global` block
- `ask()` now fetches `/api/assistant`; `staticFallback` only on non-OK or error
- Investment refusal still fires before any network call

**Changed:** `.env.local` — added `ANTHROPIC_API_KEY=` placeholder.
**Action needed:** Add `ANTHROPIC_API_KEY` to Vercel env vars for production.

## Fix 4 — Data-loss TODO (flagged, not wired)
**Changed:** `src/lib/store.ts` — added TODO comment at top.
Server save skipped: `/api/user` PATCH requires `session.user.id` but Keel has no login/anonymous-session
flow yet. Half-wiring would always 401 silently. Left for next pass.

## Fix 5 — Paycheck "why this number" copy
**Changed:** `src/app/paycheck/page.tsx`
Added card between slider and stat tiles showing band head/body + honest "why lower" explanation:
- At suggested paycheck + not provisional: explains fat months refill buffer for lean ones
- At suggested paycheck + provisional: "An early estimate — log more months to sharpen"
- Existing provisional banner (lines 171–187) confirmed rendering
- Existing band states (under/safe/balanced/roomier/stretched) confirmed in `getBand`

## Fix 6 — Dead code
Nothing deleted:
- `src/lib/finance.ts` — imported by `src/types/index.ts`
- `src/lib/advice.ts` — imported by `src/types/index.ts`
- Deprecated engine shims — imported by `api/plan/route.ts` + `db.ts`

## Final verification
- `npm run build`: clean, 19/19 pages
- Demo seed paycheck: **9,750** (volatility 0.517, safetyFactor 0.669)
- Allocation unchanged; sums to paycheck
- Prorated outlook: fractionElapsed prevents false "running lean" at month start
- Adviser: real API call, 503 falls back gracefully, investment refused before network
- Paycheck screen: "why this number" + provisional note present
