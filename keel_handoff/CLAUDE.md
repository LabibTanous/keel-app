# CLAUDE.md — READ THIS FIRST, EVERY TIME

This repo has a **finished design** for Keel. It lives in `keel_handoff/design_reference/`.
**You must build from it. Do not invent your own UI, layout, colors, or copy.**

> If you are about to write a screen and you have NOT opened the matching file in
> `design_reference/`, stop and open it first.

## What Keel is
A calm money app for **freelancers in the UAE / GCC**. It turns irregular freelance
income into a steady monthly "paycheck," and quietly handles the things that scare
freelancers: taxes, big future bills, Zakat, and "can I actually afford this?".
Home currency is **AED**; clients pay in multiple currencies (USD/EUR/GBP/SAR).

## The rules of this handoff (non-negotiable)
1. **The design files are the spec.** Recreate them in this codebase's real stack
   (React/Vue/SwiftUI/etc.) using its existing patterns. Match layout, spacing,
   type, color, copy, states, and interactions as built — this is **high-fidelity**.
2. **`design_reference/keel-theme.js` is the single source of truth for look & feel.**
   Every color, font, radius, and shadow comes from there. Map those tokens into
   this project's theming system — do not hardcode new hex values.
   - SwiftUI port? Use `design_reference/swift/KeelTheme.swift` — same tokens, 1:1.
3. **Read `design_reference/DESIGN_HANDOFF.md`** for the per-screen breakdown,
   behavior, and state before implementing each screen.
4. When something isn't specified, **match the nearest existing Keel screen** rather
   than introducing a new pattern. Keel's whole value is consistency and calm.
5. Keep the voice: plain, honest, reassuring. Estimates are always marked as
   estimates ("≈ AED 9,000", "Estimate — not tax advice"). Never present a converted
   or estimated figure as exact.

## How to preview the design
The references are self-contained HTML. Open any `design_reference/keel-*.html` in a
browser (no build step) to see the real thing, including interactions and Tweaks.
`keel-states.html` is a gallery of loading/empty/threshold states — check it for the
states you must reproduce.

## Screens (each has a `keel-*.html` entry + components in `design_reference/components/`)
- `keel-welcome.html` — Welcome / first run
- `keel-onboard.html` — Setup wizard (one decision per step → lands on Paycheck)
- `keel-import.html` — Connect / import income data
- `keel-home.html` — Home with the **tense toggle**: forward = warm plan; back = plain rear-view
- `keel-paycheck.html` — "Set your paycheck" — the steady-pay engine
- `keel-tax.html` — Threshold-aware tax calendar (UAE + Saudi) + Zakat
- `keel-goal.html` — Saving goal with projection chart
- `keel-afford.html` — "Can I afford this?" honest purchase check
- `keel-coming.html` — Upcoming big payments
- `keel-profile.html` — Profile / settings
- Shared: `Dock` (bottom nav), `AddFlow` (global +), `Assistant` (AI adviser via `window.claude.complete`)

## Do NOT
- Do not restyle to a generic design system, Material, Tailwind defaults, etc.
- Do not drop the AED / multi-currency handling or the "≈" approximate markers.
- Do not give specific investment advice in the Assistant — keep the designed refusal.
- Do not skip loading/empty states — they are designed (see `keel-states.html`).
