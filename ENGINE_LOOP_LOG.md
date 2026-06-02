# Engine Verification Loop — Log

Bounded fix→build→test→research loop. Exit condition: committed `src/lib/engine.test.ts`
green for the full Verification Matrix + research-sourced rules, `npm run build` clean,
`tsc` 0 source errors — all holding for one loop with zero new failures.

| Iter | Target | Result | Failures fixed | Sources cited |
|------|--------|--------|----------------|---------------|
| 1 | Stand up vitest + encode full Verification Matrix + research facts; run tests + build (batch) | **GREEN** — 35/35 tests pass, build clean, tsc 0 source errors | none (engine already satisfied the matrix from prior cycles; this pins it) | UAE FTA / Decree-Law 47/2022 (CT 9% > AED 375k, 1M registration); CFPB emergency-fund 3–6mo / 6–12mo for irregular income |

## Exit Condition — MET (iteration 1)
1. ✅ `src/lib/engine.test.ts` committed (35 tests).
2. ✅ Every Verification Matrix row passes as a committed test.
3. ✅ `npm run build` clean + `tsc` 0 source errors.
4. ✅ Each web-researched rule encoded as a test with a `// source:` comment.

No further iterations — the loop terminates on "verified correct", not "forever".

## Iteration 2 — Scenario Library (KEEL_ENGINE_SCENARIOS.md, groups A–K)

Encoded every non-DECISION scenario as a committed test (suite 35 → 85 tests). Batched
all groups, ran whole suite + build together. Result: **85/85 green, build clean, tsc 0**.

| Group | Scenarios encoded | correct-already (pinned) | engine-fixed |
|-------|-------------------|--------------------------|--------------|
| A | A1,A2,A3,A4,A5,A7,A8,A9,A10 | all | — |
| B | B1,B2,B4,B5,B6,B7,B8 | all | — |
| C | C1,C2,C3,C4,C5,C6 | all | — |
| D | D1,D2,D5,D6 | all | — |
| E | E1,E2,E3 | E2,E3 | **E1** — `computeOutlook` grace window: don't flag "running lean" in the first quarter of the month (false-alarm fix) |
| F | F1,F2,F3,F4,F5,F6 | F1,F2,F3,F4,F6 | **F5** — flat-tax `taxMeaning` (+ TaxClient disclaimer) now says "on your gross income — actual likely lower after business expenses" |
| G | G1,G2 (engine primitive) | all | — |
| H | H1,H3,H4 | all | — |
| I | I1,I2,I3,I4 (engine primitives) | all | — |
| K | K1,K2,K3,K4,K5,K6 | all | — |

**Engine fixes: 2** (E1, F5). **Correct-already pinned: 46.**

Source cited this iteration: none new (UAE CT + CFPB from iteration 1 still cover the
financial facts; E1/F5 are behavioural/copy rules, not external facts).

### NOT encoded in engine.test.ts (out of pure-engine scope — covered elsewhere)
- G4 (Zakat "≈"/disclaimer), H2 ("≈ AED" marker) — UI copy in TaxClient/ui.tsx.
- I5 (goal contribution capped ≤40% spending) — lives in `store.computePlan`, not engine.ts.
- J1–J6 (adviser coaching stance, refusal) — `Assistant.tsx` (system prompt + `isSpecificInvestmentPick`).

### DECISION entries — queued for human (NOT implemented)
A6, B3, D3, D4, E4, F7, G3, H5 — see the decision batch surfaced in chat.

## Iteration 3 — DECISION entries A6, E4, B3 (approved) + G3 paused

Suite 85 → **95 tests, all green**, build clean, tsc 0. Engine fixes (3):

| ID | Fix | Test |
|----|-----|------|
| **A6** | `computeRangeFromIncomes` filters out `confidence==='possible'` before ranging — speculative income still shows in Coming but doesn't size the safe paycheck | all-confirmed > all-possible; 'possible' windfall doesn't inflate likely; possible-only → floor |
| **E4** | `computeOutlook`/`detectSignals` take optional `incomePattern`; for project/irregular/quarterly a known-empty month is never "running lean" (annualised pace), but a strong month still surfaces. store threads `profile.incomePattern` through | quarterly mid-gap → on track; monthly still lean; strong still surfaces; detectSignals suppresses lean for lumpy |
| **B3** | `computePaycheck` trims ~10% when runway < 1 month, applied before the floors so essentials stay protected; demo runway 3.7 → no haircut | thin buffer ≤ healthy (and <); haircut never starves essentials; demo 9,750 unchanged |

Signatures kept stable (E4 added optional trailing params only). No new external source
needed (A6/E4/B3 are behavioural rules).

### Deferred (untouched, by instruction)
D3, D4 (need a per-income client/source tag the data model lacks), F7 (gross stays +
disclaimer), H5 (AED-home stays).

### G3 — PAUSED for one product answer
Re-derive zakatableWealth live instead of the frozen onboarding snapshot — but what
counts as zakatable? Question surfaced to the human; encode after the answer.

## How to re-run
`npm test` (vitest) — must stay green. The demo-seed → 9,750 case is the regression anchor.

## Tooling added (test infra only, not product features)
- `vitest` (devDependency, MIT) + `npm test` script.
- `tsconfig.json` excludes `src/**/*.test.ts` from the Next production build (vitest runs them).
