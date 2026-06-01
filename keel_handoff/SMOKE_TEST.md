# Keel — Post-Build Smoke Test & Cleanup Checklist

Run this **after** the full build, before calling it done. Work top to bottom. For every
screen, the rule is: **open the matching `keel_handoff/design_reference/keel-*.html` side by
side and diff against your implementation.** Don't check from memory.

Mark each item ✅ pass / ❌ fail / ⚠️ partial. Do not report "done" until every ❌ is resolved.

---

## 0. Repo hygiene — old UX must be GONE
The #1 failure last time was leftover/competing UI. Hunt it down.

- [ ] **Default framework scaffolding deleted.** No starter `page.tsx`/`App.tsx` demo, no
      "Get started by editing…", no boilerplate logo, no demo CSS modules, no example routes.
      - Run: `grep -rniE "get started by editing|learn next|vite \+ react|edit src/app/page" src/`  → expect **0 hits**.
- [ ] **The earlier (ignored) UI attempt is removed.** No half-built screens, no duplicate
      "Home/Dashboard" from before, no dead routes. Every file under the app's source dir is
      part of the Keel implementation or a shared lib it imports.
- [ ] **No orphan / unreferenced files.** Every component is imported somewhere. 
      - Run a dead-file check (e.g. `npx knip` or `npx ts-prune`) → no Keel screen flagged unused.
- [ ] **No duplicate component definitions.** Exactly one `Card`, one `Segmented`, one
      `Switch`, one `TenseToggle`, one `Dock`, one `Assistant`, etc. 
      - Run: `grep -rn "function Card\|const Card\|export.*Card" src/` → one source of truth.
- [ ] **The prototype files are NOT being served as the app.** `keel_handoff/design_reference/`
      may stay in the repo as reference, but **no route renders those raw `.html`/`.jsx`
      prototypes**, and the Babel/CDN React `<script>` tags from the prototypes appear nowhere
      in the app bundle. 
      - Run: `grep -rn "babel/standalone\|unpkg.com/react" src/` → **0 hits** in app source.
- [ ] **No stray `styles`/global name collisions** carried over from the prototype JSX.
- [ ] `git status` is clean of accidental temp files; `.gitignore` sane; build artifacts not committed.

---

## 1. Tokens & theme — `keel-theme.js` is the only source of truth
- [ ] All tokens live in one place (e.g. `keel.css`) and are consumed as variables. 
      - Run: `grep -rniE "#[0-9a-f]{6}" src/ | grep -vi "keel.css"` → **0 hits** (no hardcoded
        hex outside the token file). Every color is `var(--…)`.
- [ ] **No Tailwind palette leakage** on Keel screens. 
      - Run: `grep -rnE "(bg|text|border)-(slate|gray|zinc|neutral|blue|indigo|emerald|green|red|amber|stone)-[0-9]" src/` → **0 hits** on Keel components.
- [ ] Every token present: `--bg --surface --surface-2 --ink --muted --hairline --pine
      --pine-soft --clay --clay-soft --gold --gold-soft --mint --mint-soft --zakat --zakat-soft
      --on-pine --hero-bg --hero-ink` **and** the back set `--back-surface --back-surface-2
      --back-ink --back-muted --back-hairline`. None missing.
- [ ] Spot-check exact values: `--bg #EBE6DA`, `--surface #FBFAF5`, `--pine #1F4D3A`,
      `--clay #C16A3B`, `--gold #A6822F`, `--mint #2FA374`, `--zakat #2E6E6B`, `--on-pine #F4F1E6`.
- [ ] Fonts load: **Fraunces** (display/numbers, `.serif`) + **Hanken Grotesk** (UI). Tabular
      figures (`.tnum`) on every money number. Smallcaps labels = 11.5px, 600, letter-spacing .14em, uppercase.
- [ ] Shape: card radius **22px**, pill **999px**, base pad **18px**. Shadows = `--shadow` / `--shadow-sm`.
- [ ] `prefers-reduced-motion`: `.rise` entrance and `.sk` pulse disabled when set.

---

## 2. The Back ("Spent") palette — the easy thing to get wrong
- [ ] Toggling to **Spent** swaps the stage to the **drained** palette via `.stage.back` (or
      equivalent), **not** dark mode. Surfaces go gray (`#F0F0EC` light / `#1C1F1C` dark), ink
      goes muted (`#44473F` / `#B7B9AD`). Layout is identical — only warmth drains out.
- [ ] In **light** mode: Spent view is gray-warm, NOT the dark theme.
- [ ] In **dark** mode: Spent view uses the dark-back set, still drained relative to Spending.
- [ ] Toggling back to **Spending** restores pine/warmth instantly; the sliding thumb springs
      (calm cubic-bezier, slight overshoot, not bouncy). Thumb is pine in Spending, gray in Spent.
- [ ] Toggle labels read exactly **Spent** (left) / **Spending** (right), each with its icon.

---

## 3. Per-screen fidelity (diff each against its `keel-*.html`)

### Home (`keel-home.html`)
- [ ] Hero paycheck card on `--hero-bg` with `--hero-ink`: "AED" small, **14,000** large serif, "/mo".
- [ ] Heads-up **Signal** sits directly under the hero and reflects the outlook state.
- [ ] **Range band** shows lean/likely/strong zones (clay-soft / pine-soft / gold-soft) with the
      paycheck pin at 14,000 and a "so far" tracking marker.
- [ ] **Allocation** bar + rows: Rent & bills 6,200 / Tax set-aside 1,200 / Runway buffer 1,800 /
      Spending 4,800. With Zakat ON: Zakat 150 added, Spending → **4,650**. Disclaimer present.
- [ ] **Big payments ahead** card (2 shown, "All 4 →" link), total = sum of BIG_PAYMENTS.
- [ ] Afford entry card links to `keel-afford.html` equivalent.
- [ ] All three outlooks render correctly (see §5).

### Paycheck (`keel-paycheck.html`)
- [ ] Slider + SVG bar chart with dashed wage line; band classification updates live: 
      **Safer (mint) ≤ ~? / Balanced (pine) / Roomier (gold) / Stretched (clay) above likely**.
- [ ] StatTiles: "Saved in a likely month", "Months under this pay". Sticky save bar at bottom.

### Goal (`keel-goal.html`)
- [ ] `GoalChart`: solid line = saved, dashed = projection, dot = "you are here". Behind vs ahead
      copy switches correctly.

### Afford (`keel-afford.html`)
- [ ] Amount input → verdict tier **fits / dips / break** (NOT generic pass/fail), each with its
      icon + sentence, plus the **MiniBar** showing effect on the month. Reads against the **plan**
      (what's-left + buffer), never raw bank balance. Empty state offers example purchases.

### Coming (`keel-coming.html`)
- [ ] Timeline of items with confidence chips **Confirmed (mint) / Likely (gold) / Unconfirmed (clay)**.
- [ ] `CountToggle` flips an item between "Count it" / "In the plan". FX items show native + `≈ AED`.

### Tax (`keel-tax.html`)
- [ ] Region-aware (UAE + Saudi); turnover **gauge** shows progress to next threshold.
- [ ] Obligations surface by `statusOf(limit, turnover)`: low earner = calm "nothing yet";
      nearing line = heads-up; over = active. **Zakat** item (2.5% wealth) shows when enabled.
- [ ] **Disclaimer ("Estimate — not tax advice") on every figure.**

### Onboarding (`keel-onboard.html`)
- [ ] Exactly **5 steps**: Region → Essentials → Buffer(savings) → Seed income → Ready. Slim
      progress bar + "n / 5". Back on step 1 → Welcome. Final CTA → Paycheck. Sticky Continue;
      CTA copy changes ("Build my plan" on step 4, "See your paycheck" on last).

### Welcome / Import / Profile
- [ ] Welcome: value prop ("A steady paycheck / An honest range / What's coming").
- [ ] Import: connect/import income flow present.
- [ ] Profile: settings rows, region/AED, theme switch, Zakat toggle, Manage notifications sheet
      (signals / lean / invoice / goal).

---

## 4. Shared interactive pieces
- [ ] **Dock** bottom nav present on all main screens; active state correct; routes work.
- [ ] **AddFlow** global "+": step 1 choose type → step 2 correct form (income has Confirmed/
      Likely/Unsure segment + currency). Opens/closes as a sheet.
- [ ] **Assistant**: opens, shows suggested prompts, streams answers via `window.claude.complete`
      with the plan as context.
- [ ] **Assistant refusal works**: ask "What stock should I buy?" → it declines specific
      investment advice with the designed message (does NOT recommend a stock/crypto). Test
      "buy bitcoin", "which ETF", "should I day trade" too.

---

## 5. States — `keel-states.html` is the checklist, not a screen to build
For **every** screen, verify the non-happy states exist and look designed:
- [ ] **Loading**: skeleton (`ScreenSkeleton`/`SkCard`) shows during fetch — calm pulse, not a spinner.
- [ ] **Empty**: e.g. Home "No plan yet" → warm setup prompt; Afford empty → example purchases.
- [ ] **Home outlooks** all three: `running lean` (clay dot, filled clay-soft card, "Income's
      light so far…"), `on track` (**mint dot but CALM bordered card on `--surface`, lead
      "Looking ahead"** — not a filled mint card), `strong` (gold dot, filled gold-soft, "Ahead of plan…").
- [ ] **Tax thresholds**: approaching / over / nothing-yet variants all reachable.

---

## 6. Currency / FX correctness
- [ ] Home currency is **AED** everywhere the plan is summed.
- [ ] Foreign items show native format (`$2,450`, `€600`, `SAR …`) **and** the converted figure
      **with the `≈` marker** (`≈ AED 9,000`). A converted number is NEVER shown as if exact.
- [ ] FX rates come from one place (`CCY` map), not scattered literals.

---

## 7. Build, console, a11y
- [ ] `npm run build` (or equivalent) succeeds with **no errors**.
- [ ] Lint/typecheck clean (`tsc --noEmit`, eslint) — no `any`-dumping that hides breakage.
- [ ] **Browser console clean** on every screen: no errors, no React key warnings, no 404s for
      fonts/assets, no hydration mismatches.
- [ ] No layout shift on load beyond the intended `.rise` entrance.
- [ ] Tap targets ≥ 44px (dock items, toggles, buttons).
- [ ] Keyboard: toggles/segmented/buttons focusable and operable; visible focus.
- [ ] Light **and** dark themes both render every screen correctly (and each has its own Back palette).

---

## 8. Cross-cutting consistency
- [ ] Vocabulary locked: **lean / likely / strong** (never low/med/high or "forecast");
      outlook states named exactly `running lean` / `on track` / `strong`.
- [ ] Tone: plain, honest, reassuring. Estimates marked as estimates. No invented precise numbers.
- [ ] Same primitives reused across screens — no one-off restyled Card/Button that drifts from the system.
- [ ] Numbers consistent across screens (paycheck 14,000; likely 16,000; buffer today 23,000;
      full runway 42,000) — they should agree, since screens read shared plan state.

---

## 9. Final sign-off
- [ ] I opened every `keel-*.html` reference next to my build and confirmed a visual match.
- [ ] Every ❌ above is resolved; remaining ⚠️ items are listed with a reason.
- [ ] No old UX file remains; the app source contains only the Keel implementation + its shared lib.
- [ ] Committed in logical chunks; final commit pushed.

> Report the result as a table: section → pass/fail → notes. Do not summarize as "looks good" —
> show the checklist with each box marked.
