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

## How to re-run
`npm test` (vitest) — must stay green. The demo-seed → 9,750 case is the regression anchor.

## Tooling added (test infra only, not product features)
- `vitest` (devDependency, MIT) + `npm test` script.
- `tsconfig.json` excludes `src/**/*.test.ts` from the Next production build (vitest runs them).
