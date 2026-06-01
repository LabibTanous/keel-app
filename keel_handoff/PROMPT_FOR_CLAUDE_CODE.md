# Prompt to paste into Claude Code

Copy everything in the box below into Claude Code as your first message in the repo.
(It assumes you've committed the `keel_handoff/` folder to the repo — see the bottom of this file.)

---

```
This repo contains a finished, high-fidelity design for "Keel" — a calm money app for
freelancers in the UAE/GCC. The design lives in `keel_handoff/design_reference/`, and there's
a `keel_handoff/CLAUDE.md` plus `keel_handoff/DESIGN_HANDOFF.md` that explain it.

Before writing ANY code:
1. Read `keel_handoff/CLAUDE.md` and `keel_handoff/DESIGN_HANDOFF.md` in full.
2. Open every file in `keel_handoff/design_reference/` — the `keel-*.html` screens, the
   `components/*.jsx`, and especially `keel-theme.js` (the single source of truth for all
   colors, fonts, radii, shadows). You can open the HTML files in a browser to see the real,
   interactive design including loading/empty states (`keel-states.html`).

Your task is to recreate these screens in THIS codebase using its existing stack and patterns
(if there's no UI stack yet, tell me what you recommend before building). This is high-fidelity:
match the layout, spacing, typography, color, copy, interactions, and states as designed. Do
not invent your own UI, restyle to a generic design system, or drop the AED/multi-currency
handling and the "≈" approximate markers.

Start by:
- Mapping the tokens in `keel-theme.js` into this project's theming system.
- Giving me a short implementation plan: which screen you'll build first, the shared
  primitives you'll create (Card, Segmented, Switch, Disclaimer, skeletons, currency helpers),
  and how you'll structure plan state (the monthly paycheck / what's-left / buffer that most
  screens read from).

Then build screen by screen, checking each against its `keel-*.html` reference. Ask me before
introducing any pattern that isn't in the design.
```

---

## Why Claude Code ignored the design last time (and how this fixes it)
- The files were in the repo, but nothing **told** Claude Code to use them, so it built its own
  thing. `CLAUDE.md` at the repo root is read automatically at the start of every Claude Code
  session — so the instruction "build from `design_reference/`, don't invent UI" is always in
  context now.
- The prompt above makes the first action **"read the design, then make a plan,"** instead of
  "start coding." That's the step that was skipped before.

## Getting this into your repo
1. Download the `keel_handoff` folder (I'll provide it as a zip).
2. Unzip it into the **root** of your repo so you have `your-repo/keel_handoff/...`.
3. Move (or symlink/copy) `keel_handoff/CLAUDE.md` to the repo root as `CLAUDE.md` if you want
   it auto-loaded in every session (recommended). Leaving it inside `keel_handoff/` also works —
   just keep the path right in the prompt.
4. Commit and push:
   ```
   git add keel_handoff CLAUDE.md
   git commit -m "Add Keel design handoff + Claude Code instructions"
   git push
   ```
5. Open Claude Code in the repo and paste the prompt above.
