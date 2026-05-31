# HANDOVER.md — Keel App

**Last updated:** 2026-05-31
**Live URL:** https://keel-app-gold.vercel.app
**GitHub:** https://github.com/LabibTanous/keel-app
**Vercel project:** `keel-app` (prj_MeU8wubIRWAhwSVrKTsEVZvA1rMR) — team `labibtanous-projects`

---

## Current state at a glance

| System | Status | Notes |
|--------|--------|-------|
| Build | ✅ Green | `npm run build` clean |
| Vercel deploy | ✅ Live | Auto-deploys on push to `master` |
| Supabase | ✅ Active | Tables in Bloom project (vrxgodfbktgqkdhqspcf) |
| Auth | ✅ Working | Anonymous + Google + demo user |
| Runtime errors | ✅ None | Zero errors in last 24h |

---

## Stack

- **Framework:** Next.js 16, TypeScript strict
- **Styling:** Tailwind CSS
- **Auth:** next-auth v5 — anonymous (localStorage UUID), Google OAuth, demo user
- **DB:** Supabase (`@supabase/supabase-js`) — keel tables live in Bloom's project
- **UI components:** Radix UI, Lucide icons

---

## Architecture

### Auth flow (no login required)
1. User clicks "Start for free" on landing page
2. localStorage UUID generated (`keel_anonymous_id`)
3. `signIn("anonymous", { userId })` → next-auth session
4. Redirect → `/onboarding` → `/dashboard`

### Database
**Project:** Bloom Supabase (`vrxgodfbktgqkdhqspcf`, US East 1)

Tables:
- `keel_users` — profile, region, income type, expenses, savings, reserve, onboarding flag, log_token
- `keel_income_entries` — income log (user_id, amount, source, note, date)
- `keel_expense_entries` — expense log (user_id, amount, category, note, date) ← UI not built yet

**Note:** Verdict Supabase project is PAUSED. Restore: `POST /v1/projects/dwtfcsvmlxoyhljjddlt/restore`

### Key files
```
src/
├── lib/
│   ├── auth.ts          — NextAuth config (3 providers)
│   ├── db.ts            — Supabase query layer
│   ├── supabase.ts      — Lazy Supabase client
│   ├── finance.ts       — Rolling avg, runway, format currency
│   ├── advice.ts        — Rule-based advice engine
│   └── tax-profiles.ts  — Tax/reserve config for 9+ countries
├── app/
│   ├── page.tsx         — Landing page
│   ├── onboarding/      — 5-step setup wizard
│   ├── dashboard/       — Main dashboard (server + client components)
│   └── profile/         — Settings page (edit region, income type, expenses)
└── api/
    ├── user/            — GET/PATCH user profile
    ├── income/          — GET/POST income entries
    ├── expenses/        — GET/POST/DELETE expenses (API only, no UI yet)
    └── quick-log/       — GET with token param (iOS Shortcut)
```

---

## Vercel env vars

| Var | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vrxgodfbktgqkdhqspcf.supabase.co` | Bloom project |
| `SUPABASE_SERVICE_ROLE_KEY` | [encrypted] | Bloom service role |
| `AUTH_SECRET` | [encrypted] | next-auth secret |
| `GOOGLE_CLIENT_ID` | [encrypted] | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | [encrypted] | Google OAuth |
| `NEXT_PUBLIC_APP_URL` | [encrypted] | App URL |
| `DATABASE_URL` | [encrypted] | OLD Neon — unused, harmless |

---

## Features built

| Feature | Status | Location |
|---------|--------|----------|
| Anonymous sign-in (no login) | ✅ | `auth.ts` + `page.tsx` |
| 5-step onboarding | ✅ | `app/onboarding/` |
| Income logging | ✅ | `api/income/` + dashboard modal |
| 6-month rolling average budget | ✅ | `lib/finance.ts` |
| Tax reserve by country | ✅ | `lib/tax-profiles.ts` |
| Runway calculator | ✅ | `lib/finance.ts` |
| Income mode (lean/normal/flush) | ✅ | `lib/finance.ts` |
| Can I afford this? | ✅ | `DashboardClient.tsx` |
| AI advice cards (rule-based) | ✅ | `lib/advice.ts` |
| Income by source breakdown chart | ✅ | `DashboardClient.tsx` |
| Profile / settings page | ✅ | `app/profile/` |
| iOS Shortcut quick-log | ✅ | `api/quick-log/` |
| Mobile FAB + bottom sheet | ✅ | `DashboardClient.tsx` |
| Expense entries API | ✅ | `api/expenses/` |
| Demo user | ✅ | demo-user-001 in DB |

## Features NOT yet built

| Feature | Priority | Notes |
|---------|----------|-------|
| Expense entries UI | HIGH | API + DB ready, just needs UI |
| Tax calendar / deadline reminders | HIGH | Quarterly payment dates by country |
| Savings goals | MED | Target amount + progress tracker |
| Monthly report / CSV export | MED | Summary of income vs expense |
| Invoice tracking | LOW | Who owes me + amount |
| Push notifications | LOW | Tax deadline alerts |

---

## iOS Shortcut setup

Each user has a `log_token` (UUID) in `keel_users`. Quick-log URL:
```
https://keel-app-gold.vercel.app/api/quick-log?token=THEIR_TOKEN&amount=5000&source=Client
```
Shown in dashboard → "Log income from your phone" expandable section.

---

## Running locally

```bash
cd keel-app
npm install
# Create .env.local with:
# NEXT_PUBLIC_SUPABASE_URL=https://vrxgodfbktgqkdhqspcf.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
# AUTH_SECRET=<any random string>
npm run dev
```

---

## What Labib must do

**Nothing blocking.** All infra is live and connected.

### QA to run
1. Go to https://keel-app-gold.vercel.app → click "Start for free" → onboarding → dashboard
2. Log income → verify numbers update
3. Visit `/profile` → edit settings → save → return to dashboard
4. Test "Can I afford this?" with a large number (should show "Not right now")
5. Open iOS Shortcut section → test the quick-log URL in browser
