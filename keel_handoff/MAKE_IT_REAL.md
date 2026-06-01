# Make Keel real — responsive + live engine (do this BEFORE the smoke test)

Paste `PROMPT` below into Claude Code. It must complete Phases 1–3, then run
`SMOKE_TEST.md`. The design is correct; the problem is it's a fake-phone shell full of
hardcoded numbers. Keep the visuals identical — change the chrome and the data layer only.

---

## PHASE 1 — Kill the fake phone; make it a real responsive web app
The Vercel deploy renders the prototype's device bezel (notch, "9:41", battery, home
indicator, rounded frame) as the actual app. Remove all of it.

- Delete/stop using the `ios-frame` device wrapper in the shipped app. Screens render
  directly into the page.
- No status bar, no fake notch, no signal/battery glyphs, no home-indicator bar, no phone
  outline. None of that is app UI.
- Mobile-first, genuinely responsive:
  - The app fills the viewport on phones (100dvh, full width).
  - On tablet/desktop, center the app in a single column (max-width ~480px) on the `--bg`
    canvas — a real centered web-app column, NOT a phone illustration.
  - Use `100dvh` (not `100vh`) and `env(safe-area-inset-*)` so it sits right under real
    device notches / home bars on actual phones.
  - The Dock becomes a real bottom nav fixed to the viewport bottom (respecting safe-area
    inset), not a bar floating inside a fake screen.
- Verify on real breakpoints: 360×640, 390×844, 768, 1280. No horizontal scroll, no clipped
  content, no fixed pixel widths that break small screens. Type/spacing scale sensibly.

## PHASE 2 — Replace ALL hardcoded data with a live engine driven by onboarding
Right now numbers are constants scattered in components. Build a real plan engine and a single
source of truth that the whole app reads from.

### 2a. One store, persisted
- Create a single **PlanStore** (React Context or Zustand) that holds the user **Profile** +
  derived **Plan**, persisted (localStorage now; if a backend/db exists in the repo, use it).
- Onboarding's final step **commits the collected inputs to the store** — it must not navigate
  to a Home full of demo numbers. Home renders from the store.
- Editing anywhere (AddFlow "+", Paycheck slider, Profile settings, Coming "count it" toggles)
  mutates the store → engine recomputes → every screen updates → persists.
- Provide a "reset / load demo profile" action. The current hardcoded values become the
  **seed demo profile only** (used for empty-state preview and tests), never baked into screens.

### 2b. The engine (pure, deterministic, documented) — `lib/engine.ts`
Inputs (Profile, from onboarding + ongoing activity):
- `region` (+ home currency), `essentials` (monthly rent + bills), `bufferBalance`,
  `targetMonths` (default 3), `incomes[]` ({amount, currency, date, confidence}), `zakatOn`.

Derived (Plan) — compute, don't hardcode:
- **FX**: convert every income to home currency via the `CCY` rate map; keep the `≈` marker on
  any converted figure.
- **Income range** from the monthly income series: `likely` = median monthly total,
  `lean` ≈ 20th percentile (or recent min), `strong` ≈ 80th percentile (or recent max). With
  <3 months of data, mark the plan **provisional** and widen the band (don't fake precision).
- **Recommended steady paycheck**: the largest amount that is **≤ likely**, **≥ essentials**,
  and still leaves a positive buffer contribution. Keep the design's band classification
  relative to the computed `essentials`/`likely`: Safer (mint) / Balanced (pine) / Roomier
  (gold) / Stretched (clay, when above likely).
- **Allocation** of the paycheck: Rent & bills = `essentials`; Tax set-aside = region tax rate ×
  turnover estimate (UAE: 9% on turnover over the corporate-tax threshold, else 0 — surface as
  an estimate); Zakat = `zakatOn ? zakatableWealth × 0.025 / 12 : 0` (carved out of Spending);
  Runway buffer = contribution toward target; Spending = remainder. Buckets must sum to paycheck.
- **Runway** = `bufferBalance / essentials` (months); **target** = `essentials × targetMonths`.
- **Tax**: keep the region rulebook (UAE + Saudi) already in the Tax screen; drive each
  obligation's status from `statusOf(limit, trackedTurnover)` where `trackedTurnover` = sum of
  counted income YTD — not a preset.
- **Outlook signal** (`running lean` / `on track` / `strong`): compute by comparing income
  tracked so far this month against the expected pace; pick the matching named state (keep the
  exact three states, colors, and the calm-card rule for `on track`).
- **Afford** verdict (`fits` / `dips` / `break`): compute against the live plan (what's-left-to-
  spend + buffer + safe floor), never a raw bank balance.

### 2c. Prove nothing is hardcoded
- These must no longer exist as literals inside screens: `SUGGESTED 14000`, `LIKELY 16000`,
  the `OUTLOOK` tracking numbers, `BIG_PAYMENTS`, `AFFORD_PLAN`, `TURNOVER` presets, the
  allocation `6200/1200/1800/4800`. They are either engine outputs or seed-demo data.
- Run: `grep -rnE "14000|16000|23000|6200|4800|1800" src/` → any hit must be in the demo-seed
  file or a test, **never** rendered directly by a screen.
- Drive a fresh onboarding with different numbers (e.g. essentials 3,000; three incomes
  4k/9k/2k USD) and confirm Home, Paycheck, Range, Allocation, Tax, Afford **all change
  accordingly and agree with each other**. Refresh the page → values persist.

## PHASE 3 — Use subagents + skills to make it genuinely functional
- Parallelize with subagents: (1) responsive de-frame, (2) engine + store, (3) per-screen
  wiring to the store, (4) end-to-end verification. Keep one subagent as integrator.
- Actually run it: start the dev server and click the full flow with a real browser/automation
  skill (e.g. Playwright/Puppeteer) — Welcome → Onboarding (enter custom values) → Home →
  Paycheck → Goal → Afford → Coming → Tax → Profile. Use whatever testing/browser skills and
  MCP tools are available; don't just read code.
- Write a few engine unit tests (range percentiles, paycheck recommendation, allocation sums to
  paycheck, runway, Zakat math, FX conversion) and a smoke e2e that asserts onboarding inputs
  flow through to Home.
- Confirm `window.claude.complete` (Assistant) still works and is fed the **live** plan, not the
  old static context string.

## PHASE 4 — Run the full smoke test
Only after Phases 1–3 pass, run **`keel_handoff/SMOKE_TEST.md`** top to bottom, including the
§0 cleanup greps, and report the marked-up table. Add two extra checks:
- No fake-phone chrome anywhere in the shipped app; responsive at 360/390/768/1280.
- No hardcoded plan numbers in screens (the grep above); onboarding→all-screens sync verified
  live and persists across refresh.

Keep the visual design pixel-identical to the `keel-*.html` references throughout — you are
changing the **chrome** (no bezel, responsive) and the **data layer** (live engine), nothing
about the look.
