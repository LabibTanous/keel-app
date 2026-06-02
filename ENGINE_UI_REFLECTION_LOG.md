# Engine → UI Reflection Audit

Goal: every behavior the engine computes is visible, correct, and understandable on
screen — no engine intelligence invisible or contradicted in the UI. Audited each
behavior engine → store/plan → screen; fixed the gaps. Suite 98 → **102 green**,
build clean, tsc 0, demo seed 9,750 holds.

| # | Behavior | Surfaces in UI (file) | Status | UX change made |
|---|----------|----------------------|--------|----------------|
| 1 | **A6** — speculative ('possible') income doesn't size pay but still shows | Coming (ComingClient.tsx) | **FIXED** | 'possible' rows now carry a per-item note "Tracked only — hoped-for money doesn't size your safe paycheck until it's confirmed." (ConfPill already colour-coded clay; summary copy already present). Engine already filters 'possible' from the range. |
| 2 | **E4** — lumpy earner's quiet month reads "on track" + is explained | Dashboard topInsight (dashboard/page.tsx) via interpret | **FIXED** | `interpret().outlookMeaning` gains a lumpy branch: "A quiet month is normal on your pattern — your pay is set from the whole year…"; surfaces via `topInsight` (success level) which the dashboard now renders. store threads `profile.incomePattern` into interpret. |
| 3 | **B3** — thin-buffer haircut says *why*, not a silent lower number | Paycheck (PaycheckClient.tsx) via interpret | **FIXED** | `interpret().paycheckWhy` gains a `runway < 1` branch: "Trimmed a little to help rebuild your buffer…". Paycheck screen now renders `plan.interpretations.paycheckWhy` (was two hardcoded conditional strings that missed the haircut case). |
| 4 | **Interpretation layer** (paycheckWhy / runwayMeaning / outlookMeaning / taxMeaning / volatilityMeaning / topInsight) renders, severity-ranked | Paycheck, Dashboard, Tax | **FIXED** | Paycheck renders live `paycheckWhy` (was hardcoded). Dashboard now shows `topInsight` at **all** severities incl. **warning** (was filtering warnings out — the most important insights were dropped). `volatilityMeaning` already on paycheck; `runwayMeaning`/`outlookMeaning` surface via `topInsight`; `taxMeaning` on tax screen. |
| 5 | **Tax** (none/flat/uae_ct) renders correctly + gross disclaimer; dashboard ↔ tax reconcile | Tax (TaxClient.tsx), Dashboard | **already-correct** | TaxClient branches per `profile.taxMode` (NoTaxCard / FlatTaxCard / TurnoverCard+CorporateTaxCard). Gross disclaimer on flat + CT. Both dashboard `allocation.tax` and the tax screen derive from the single `estimateAnnualTax()` (÷12) → reconcile. |
| 6 | **Zakat** (incl. G3) shows, hidden when 0, ≈ AED + disclaimer, updates as buffer changes | Tax (TaxClient.tsx), Dashboard | **already-correct** (G3 wired this turn) | ZakatItem reads `plan.zakatableWealth` (live, re-derived, property excluded). Hidden when 0 (`showZakat`). ≈ AED + "estimate, not advice" present. Dashboard zakat row hidden when 0. |
| 7 | **Multi-currency** — native + ≈ AED everywhere | Coming (ComingClient.tsx), Dashboard | **already-correct** | Coming rows show native (`fmtFx`) + "≈ AED" second line for foreign income. Dashboard earned shows "≈ AED". (Paycheck history chart is AED-normalised totals — no per-currency figure to mark; acceptable.) |
| 8 | **Goals** — per-goal progress (not whole buffer), real projected date, trade-off framing | Goal (GoalClient.tsx) | **already-correct** + provisional caveat **FIXED** | `saved` is apportioned per-goal and capped at target (not whole buffer). Projected date is computed from contribution. Trade-off (newSpending/monthsToGoal) shown. **Added:** an "early estimate" caveat under the projection when `plan.range.provisional`. |
| 9 | **Provisional / low-confidence** clearly marked on every screen that shows the number | Paycheck, Dashboard, Goal | **FIXED** | Paycheck already had a provisional notice. **Added:** an "EARLY ESTIMATE" chip on the dashboard paycheck hero, and the goal-projection caveat (above) — both read `plan.range.provisional`. |
| 10 | **Cross-links** — afford "wait n days for a confirmed payment" hint renders when it fires | Afford (AffordClient.tsx) | **already-correct** | `crossLinkAffordWithIncoming` is called and the hint renders on dips/break with the confirmed amount + days-away. Afford checks `plan.discretionary` (not bank balance). Verdict reads live `computeAfford`. |

## Outcome
- **Fixed:** A6 (Coming copy), E4 (lumpy outlook copy + render), B3 (haircut why + render), interpretation-layer rendering (paycheckWhy live + dashboard warnings shown), provisional markers (dashboard chip + goal caveat).
- **Already-correct (verified live, not hardcoded):** tax modes + reconcile, Zakat (G3), multi-currency, goals core, afford cross-link.
- New interpret copy is committed-test-pinned (B3 paycheckWhy, E4 outlookMeaning).
- No engine behavior left invisible or contradicted on screen.

## Guardrails held
Demo 9,750 still a passing test · computePaycheck untouched (B3 copy only describes the
existing haircut) · no design-token changes — copy/badges/states only within existing
tokens · deprecated exports + dormant EG/JO brackets intact · `computeAllocation` params
not reordered · signatures stable (interpret gained an optional `incomePattern`) · no test
weakened · no hardcoded/faked displayed numbers — every value reads from `plan`.
