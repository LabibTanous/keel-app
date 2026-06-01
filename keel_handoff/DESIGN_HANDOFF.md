# Handoff: Keel — freelancer money app (UAE / GCC)

## Overview
Keel turns irregular freelance income into a **steady monthly paycheck** and quietly
handles the rest: future big bills, taxes, Zakat, and an honest "can I afford this?"
check. It is calm, warm, and trustworthy — the opposite of a busy fintech dashboard.

Audience: freelancers and independents in the UAE / GCC. Home currency **AED**; clients
pay in **USD / EUR / GBP / SAR**, so the plan is always shown in AED with converted
figures **visibly marked approximate** (e.g. `≈ AED 9,000`) — never as if exact.

## About the design files
The files in `design_reference/` are **design references built in HTML** — high-fidelity
prototypes of the intended look and behavior, not production code to ship as-is. Your job
is to **recreate these screens inside this repo's existing environment** (React, Vue,
SwiftUI, native — whatever the codebase uses), using its established components and
patterns. If the repo has no UI environment yet, choose the most appropriate framework and
implement them there.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and interactions are final.
Recreate pixel-faithfully using this codebase's libraries. Don't approximate the visuals.

## Design tokens — `keel-theme.js` is the single source of truth
Every screen reads CSS variables generated from `KEEL_THEME` in `design_reference/keel-theme.js`.
Map these into this project's theming system; do not hardcode new values. SwiftUI: use
`design_reference/swift/KeelTheme.swift` (identical tokens).

### Type
- Display / numbers: **Fraunces** (serif), optical sizing on. Weights 400/500/600.
- UI / body: **Hanken Grotesk** (sans). Weights 400/500/600/700.
- `.serif` for display, `.tnum` for tabular figures, `.smallcaps` for 11.5px uppercase labels (letter-spacing .14em).

### Shape & spacing
- Card radius `22px`; pill radius `999px`; base padding `18px` (`--pad`).
- Shadows: `--shadow` (cards), `--shadow-sm` (small). See theme file for exact values.

### Color — light (signature) / dark
| Token | Role | Light | Dark |
|---|---|---|---|
| bg | app background | `#EBE6DA` | `#141915` |
| surface | cards | `#FBFAF5` | `#1E2620` |
| surface2 | insets/tracks | `#F2EEE2` | `#27302A` |
| ink | text | `#1A201C` | `#ECE7DA` |
| muted | secondary text | `#6B726B` | `#8C948B` |
| pine | **primary** | `#1F4D3A` | `#5AA77F` |
| clay | attention/warning | `#C16A3B` | `#D98A57` |
| gold | goals | `#A6822F` | `#CBA94E` |
| mint | positive | `#2FA374` | `#4FBE92` |
| zakat | Zakat set-aside | `#2E6E6B` | `#56A8A2` |
| onPine | text on pine | `#F4F1E6` | `#0E1611` |

Each accent has a matching `…Soft` tint for backgrounds (see theme). The **"back"/rear-view**
palette (Home tense toggle) is the same shell drained of warmth — grays under `--back-*`.

### Motion
- `.rise` entrance (opacity + 14px translateY, 0.62s ease-out), `.sk` skeleton pulse.
- Respect `prefers-reduced-motion` (theme already disables animation under it).

## Architecture of the references
- `keel-theme.js` — plain JS, loads first, injects all tokens as CSS vars. Re-skin here only.
- `ios-frame.jsx` — device frame the screens mount in (for preview only).
- `components/ui.jsx` — shared primitives: `Card`, `Segmented`, `Switch`, `Disclaimer`,
  skeletons (`Sk`/`SkCard`/`ScreenSkeleton`), `Cur` (big-figure currency), and the money/FX
  helpers (`money`, `fmtFx`, `approxAED`, `CCY`, `toAED`) plus shared data (`BIG_PAYMENTS`).
- `components/icons.jsx` — icon set.
- Each screen = `<Screen>.jsx` (the view) + `<Screen>App.jsx` (shell: header, scroll body, Tweaks).

## Screens / views
Open the matching `keel-*.html` for the live version.

1. **Welcome** (`keel-welcome.html`) — first run / value proposition.
2. **Onboarding** (`keel-onboard.html`, `OnboardApp.jsx`) — calm wizard, one decision per
   step, slim progress bar, sticky Continue. Ends on the Paycheck screen.
3. **Import data** (`keel-import.html`, `ImportApp.jsx`) — connect/import income sources.
4. **Home** (`keel-home.html`, `Home.jsx`, `HomeForward.jsx`, `HomeBack.jsx`, `TenseToggle.jsx`)
   — the core. A **tense toggle** flips between *forward* (warm plan: this month's paycheck,
   what's left to spend, runway) and *back* (a deliberately plain, gray rear-view of ordinary
   spend — the contrast is the point, same shell). Hosts the `Dock` and global `AddFlow` (+).
5. **Set your paycheck** (`keel-paycheck.html`, `Paycheck.jsx`, `PaycheckChart.jsx`) — the
   steady-pay engine: smooths irregular income into a recommended monthly wage with a buffer.
   Sticky save bar.
6. **Tax & registrations** (`keel-tax.html`, `Tax.jsx`) — a *smart*, region- and
   threshold-aware calendar, not a manual list. Obligations surface only when they apply or
   when tracked turnover nears a threshold; a turnover gauge makes the threshold visible.
   Rules are data keyed by region (UAE + Saudi). Includes **Zakat** (2.5% wealth, GCC, opt-in).
   Every figure carries the `Disclaimer` ("Estimate — not tax advice").
7. **Goal / Saving** (`keel-goal.html`, `Goal.jsx`, `GoalChart.jsx`) — saving trajectory: solid
   line = saved, dashed = projection to target & date, dot = "you are here"; behind/ahead state.
8. **Can I afford this?** (`keel-afford.html`, `Afford.jsx`) — honest purchase check against the
   **plan** (what's left to spend + buffer), NOT the raw bank balance. Amount input → verdict
   tier (fits / tight / no) + a mini-bar showing the effect on the month. Empty state offers
   example purchases.
9. **What's coming** (`keel-coming.html`, `Coming.jsx`) — upcoming big payments (`BIG_PAYMENTS`),
   each with status: Set aside (mint) / Saving (gold) / Not yet (clay).
10. **Profile** (`keel-profile.html`, `Profile.jsx`) — profile / settings, region, theme.
11. **States gallery** (`keel-states.html`) — review surface for loading / empty / threshold
    states. Reproduce these states, not just the happy path.

### Shared interactive pieces
- **Dock** (`Dock.jsx`) — bottom navigation.
- **AddFlow** (`AddFlow.jsx`) — global "+": step 1 pick what to add, step 2 a fitting form.
- **Assistant** (`Assistant.jsx`) — in-app AI adviser using `window.claude.complete`. It is
  given the user's plan as context and answers in plain language. **Designed refusal** for
  specific investment asks (stocks/crypto/etc.) — keep this behavior; the real classification
  is your job server-side, the client guard just makes it reliable.

## Interactions & behavior
- **Tense toggle** (Home): switches palette + content between forward plan and plain rear-view.
- **Segmented controls / Switch**: see `ui.jsx` (animated thumb via pixel translate).
- **Sticky save bars** on editing screens (Paycheck, parts of onboarding).
- **Loading**: skeletons (`ScreenSkeleton`/`SkCard`) while data is mid-fetch.
- **Currency**: items carry their own currency; show native (`fmtFx`) and the AED approximation
  (`approxAED`, with the `≈` marker). FX rates live in `CCY` in `ui.jsx`.
- **Tax**: `statusOf(limit, turnover)` drives each obligation's state; gauge shows progress to
  next threshold. Low earner → calm "nothing yet"; nearing a line → early heads-up.

## State management
- Plan figures (monthly paycheck, what's-left-to-spend, buffer/runway) are the spine — many
  screens read from them. Centralize them.
- `BIG_PAYMENTS` is shared between Home (forward) and Goal/Coming — keep one source.
- Tax state: selected region, tracked turnover, Zakat on/off.
- Theme: `light`/`dark` via `data-theme` (web) or `KeelMode` (SwiftUI).
- Assistant: conversation state + the plan-context prompt; investment-ask guard.

## Data / numbers note
The figures in the prototypes (AED amounts, turnover presets, FX rates, thresholds) are
**illustrative sample data** for review. Wire real data/sources in this codebase; keep the
formatting rules and the estimate/approximate markers exactly.

## Files
All under `design_reference/`:
- `keel-theme.js`, `swift/KeelTheme.swift` — tokens
- `keel-*.html` — one runnable preview per screen
- `ios-frame.jsx`, `tweaks-panel.jsx` — preview scaffolding (not app code)
- `components/*.jsx` — the screen views, shells, charts, shared `ui.jsx` + `icons.jsx`
