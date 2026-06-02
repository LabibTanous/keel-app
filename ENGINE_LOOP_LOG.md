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

## How to re-run
`npm test` (vitest) — must stay green. The demo-seed → 9,750 case is the regression anchor.

## Tooling added (test infra only, not product features)
- `vitest` (devDependency, MIT) + `npm test` script.
- `tsconfig.json` excludes `src/**/*.test.ts` from the Next production build (vitest runs them).
