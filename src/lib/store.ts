'use client';

/**
 * store.ts — Keel's single source of truth.
 * React Context + localStorage persistence.
 * Pure derivation: every Profile change triggers a full engine recompute.
 */

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { IncomeItem, Profile, IncomeRange, Allocation, Signal, GoalTradeoff, IncomingPaymentHint, Interpretations } from './engine';
import {
  toAED,
  computeRangeFromIncomes,
  computePaycheck,
  computeAllocation,
  computeRunway,
  computeOutlook,
  detectSignals,
  interpret,
  volatilityTrend,
  goalTradeoff,
} from './engine';

export type { GoalTradeoff, IncomingPaymentHint, Interpretations };
import { DEMO_PROFILE, EMPTY_PROFILE } from './demo-seed';
import type { BigPayment } from './demo-seed';

export type { Profile, IncomeItem };

// ── User goals ─────────────────────────────────────────────────────────────────

export interface UserGoal {
  name: string;
  custom: string;
  targetAmt: number;
  targetDate: string; // 'YYYY-MM' format
}

export interface ExpenseItem {
  amount: number;
  currency: string;
  date: string; // ISO 'YYYY-MM-DD'
  category?: string;
  note?: string;
}

// ── Plan (derived from Profile) ───────────────────────────────────────────────

export interface Plan {
  range: IncomeRange;
  paycheck: number;
  allocation: Allocation;
  runway: number;
  signals: Signal[];
  outlook: string;
  trackedThisMonth: number;
  taxTurnover: number;
  interpretations: Interpretations;
  volatilityTrend: { trend: 'choppier' | 'steadier' | 'stable'; message: string };
  goalInfo: GoalTradeoff;
  goalTarget: number;
  bigPayments: BigPayment[];
  userGoals: UserGoal[];
  monthlyGoalContrib: number;
  monthlyBigPaymentReserve: number;
  discretionary: number;
  thisMonthExpenses: number;
}

// ── Store interface ───────────────────────────────────────────────────────────

export interface PlanStore {
  profile: Profile;
  plan: Plan;
  setProfile: (p: Profile) => void;
  addIncome: (i: IncomeItem) => void;
  addBigPayment: (p: BigPayment) => void;
  addExpense: (e: ExpenseItem) => void;
  expenses: ExpenseItem[];
  setPaycheck: (n: number) => void;
  setTracked: (n: number) => void;
  setUserGoals: (goals: UserGoal[]) => void;
  reset: () => void;
}

// ── Pure plan derivation ──────────────────────────────────────────────────────

export function computePlan(profile: Profile, trackedOverride = 0, bigPayments: BigPayment[] = [], userGoals: UserGoal[] = [], expenses: ExpenseItem[] = []): Plan {
  // Lumpy/project earners get an annualised range (FIX N3) — see computeRangeFromIncomes.
  // Monthly earners delegate to the unchanged computeRange path.
  const range = computeRangeFromIncomes(profile.incomes, profile.incomePattern);

  // Auto-derive tracked-this-month from current-month income items already in the profile.
  // trackedOverride (from manual "mark received" actions) adds on top.
  const currentMonth = new Date().toISOString().slice(0, 7);
  const autoTracked = profile.incomes
    .filter(i => i.date.startsWith(currentMonth))
    .reduce((sum, i) => sum + toAED(i.amount, i.currency), 0);
  const trackedThisMonth = trackedOverride + autoTracked;

  const rawPaycheck = profile.paycheckOverride !== undefined
    ? profile.paycheckOverride
    : computePaycheck(range, profile.essentials, profile.bufferBalance);

  // YTD tax turnover: sum all incomes in current calendar year (AED).
  // Feeds the single estimateAnnualTax() source — UAE Corporate Tax / Egypt+Jordan
  // progressive income tax. GCC (non-UAE) has no income tax, so this is unused there.
  const thisYear = new Date().getFullYear().toString();
  let taxTurnover = profile.incomes
    .filter(i => i.date.startsWith(thisYear))
    .reduce((sum, i) => sum + toAED(i.amount, i.currency), 0);

  // Adjust turnover by employment type. IncomeItem has no source field, so we handle
  // this at the profile level:
  // - 'employed': pure employee salary is not freelance/business revenue → turnover 0.
  // - 'employed_freelance': mixed income we can't split → conservatively count all.
  // - 'sole_trader' | 'company' | undefined: all income is business → count all.
  if (profile.employmentType === 'employed') {
    taxTurnover = 0;
  } else if (profile.annualRevenue && profile.annualRevenue > 0) {
    // Self-reported annual revenue (from onboarding) counts toward tax status — a
    // high earner whose YTD logged income is still ramping still sees the right tax.
    // The higher of the two wins.
    taxTurnover = Math.max(taxTurnover, profile.annualRevenue);
  }

  const allocation = computeAllocation(
    rawPaycheck,
    profile.essentials,
    profile.region,
    profile.zakatOn,
    profile.zakatableWealth ?? 0,
    profile.bufferBalance,
    profile.targetMonths,
    taxTurnover,
    { taxMode: profile.taxMode, taxFlatRate: profile.taxFlatRate },
  );

  const runway = computeRunway(profile.bufferBalance, profile.essentials);

  // Prorate expected pace by how far through the month we are.
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const fractionElapsed = now.getDate() / daysInMonth;

  const outlook = computeOutlook(trackedThisMonth, range.likely, fractionElapsed, profile.incomePattern);
  const signals = detectSignals(range, allocation, trackedThisMonth, fractionElapsed, profile.incomePattern);

  const volTrend = volatilityTrend(profile.incomes);
  const interpretations = interpret(
    { range, paycheck: rawPaycheck, allocation, runway, outlook, trackedThisMonth, taxTurnover },
    { essentials: profile.essentials, targetMonths: profile.targetMonths, region: profile.region, taxMode: profile.taxMode, taxFlatRate: profile.taxFlatRate },
    profile.incomes,
  );

  const goalTarget = profile.essentials * profile.targetMonths;
  const goalInfo = goalTradeoff(goalTarget, profile.bufferBalance, allocation.buffer, allocation.spending);

  // Monthly goal contributions.
  // alreadySaved draws down the buffer proportionally across goals so contributions
  // shrink as the user's savings grow (instead of always assuming zero progress).
  const today = new Date();
  const totalGoalTarget = (userGoals || []).reduce((s, g) => s + Math.max(0, g.targetAmt), 0);
  let monthlyGoalContrib = 0;
  for (const g of (userGoals || [])) {
    if (g.targetAmt > 0 && g.targetDate) {
      const [y, m] = g.targetDate.split('-').map(Number);
      const targetMs = new Date(y, m - 1, 1).getTime() - today.getTime();
      const monthsLeft = Math.max(1, Math.round(targetMs / (1000 * 60 * 60 * 24 * 30.44)));
      // Buffer is shared across goals — allocate this goal's share of current savings.
      const share = totalGoalTarget > 0 ? g.targetAmt / totalGoalTarget : 0;
      const alreadySaved = Math.min(g.targetAmt, profile.bufferBalance * share);
      monthlyGoalContrib += Math.max(0, Math.round((g.targetAmt - alreadySaved) / monthsLeft));
    }
  }
  monthlyGoalContrib = Math.min(monthlyGoalContrib, Math.floor(allocation.spending * 0.4)); // cap at 40% of spending

  // Monthly big payment reserve — save over the real months-until-due (fallback 6).
  const currentYM = new Date().getFullYear() * 12 + new Date().getMonth();
  let monthlyBigPaymentReserve = 0;
  for (const bp of (bigPayments || [])) {
    let monthsUntil = 6;
    if (bp.dueDate) {
      const [dy, dm] = bp.dueDate.split('-').map(Number);
      if (dy && dm) monthsUntil = Math.max(1, (dy * 12 + (dm - 1)) - currentYM);
    }
    monthlyBigPaymentReserve += Math.round(bp.amt / monthsUntil);
  }
  monthlyBigPaymentReserve = Math.min(monthlyBigPaymentReserve, Math.floor(allocation.spending * 0.3)); // cap at 30%

  const discretionary = Math.max(0, allocation.spending - monthlyGoalContrib - monthlyBigPaymentReserve);

  const thisMonthExpenses = (expenses || [])
    .filter(e => e.date.startsWith(currentMonth))
    .reduce((s, e) => s + toAED(e.amount, e.currency), 0);

  return {
    range,
    paycheck: rawPaycheck,
    allocation,
    runway,
    signals,
    outlook,
    trackedThisMonth,
    taxTurnover,
    interpretations,
    volatilityTrend: { trend: volTrend.trend, message: volTrend.message },
    goalInfo,
    goalTarget,
    bigPayments,
    userGoals,
    monthlyGoalContrib,
    monthlyBigPaymentReserve,
    discretionary,
    thisMonthExpenses,
  };
}

// ── State & reducer ───────────────────────────────────────────────────────────

interface State {
  profile: Profile;
  trackedThisMonth: number;
  bigPayments: BigPayment[];
  userGoals: UserGoal[];
  expenses: ExpenseItem[];
}

type Action =
  | { type: 'SET_PROFILE'; payload: Profile }
  | { type: 'ADD_INCOME'; payload: IncomeItem }
  | { type: 'ADD_BIG_PAYMENT'; payload: BigPayment }
  | { type: 'SET_BIG_PAYMENTS'; payload: BigPayment[] }
  | { type: 'SET_PAYCHECK'; payload: number }
  | { type: 'SET_TRACKED'; payload: number }
  | { type: 'SET_USER_GOALS'; payload: UserGoal[] }
  | { type: 'ADD_EXPENSE'; payload: ExpenseItem }
  | { type: 'SET_EXPENSES'; payload: ExpenseItem[] }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'ADD_INCOME': {
      const newIncomes = [...state.profile.incomes, action.payload];
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const isThisMonth = action.payload.date.startsWith(currentMonth);
      const isConfirmed = action.payload.confidence === 'confirmed';
      const additionalTracked = isThisMonth && isConfirmed
        ? toAED(action.payload.amount, action.payload.currency)
        : 0;
      return {
        ...state,
        trackedThisMonth: state.trackedThisMonth + additionalTracked,
        profile: { ...state.profile, incomes: newIncomes },
      };
    }
    case 'ADD_BIG_PAYMENT':
      return { ...state, bigPayments: [...state.bigPayments, action.payload] };
    case 'SET_BIG_PAYMENTS':
      return { ...state, bigPayments: action.payload };
    case 'SET_PAYCHECK':
      return {
        ...state,
        profile: { ...state.profile, paycheckOverride: action.payload },
      };
    case 'SET_TRACKED':
      return { ...state, trackedThisMonth: action.payload };
    case 'SET_USER_GOALS':
      return { ...state, userGoals: action.payload };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };
    case 'RESET':
      return { profile: EMPTY_PROFILE, trackedThisMonth: 0, bigPayments: [], userGoals: [], expenses: [] };
    default:
      return state;
  }
}

const STORAGE_KEY = 'keel_plan_state_v1';

function loadState(): State {
  if (typeof window === 'undefined') {
    return { profile: EMPTY_PROFILE, trackedThisMonth: 0, bigPayments: [], userGoals: [], expenses: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      // Basic validation: must have profile with incomes array
      if (parsed?.profile?.incomes && Array.isArray(parsed.profile.incomes)) {
        return {
          ...parsed,
          bigPayments: Array.isArray(parsed.bigPayments) ? parsed.bigPayments : [],
          userGoals: Array.isArray(parsed.userGoals) ? parsed.userGoals : [],
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        };
      }
    }
  } catch {
    // Ignore parse errors — fall through to defaults
  }
  return { profile: EMPTY_PROFILE, trackedThisMonth: 0, bigPayments: [], userGoals: [], expenses: [] };
}

function saveState(state: State): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or private browsing — fail silently
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const PlanContext = createContext<PlanStore | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  // Always start with EMPTY_PROFILE so SSR and first client render match.
  // After mount, hydrate from localStorage to avoid React hydration mismatch.
  const [state, dispatch] = useReducer(reducer, { profile: EMPTY_PROFILE, trackedThisMonth: 0, bigPayments: [], userGoals: [], expenses: [] });

  // On first client mount, load persisted state (runs only in the browser)
  useEffect(() => {
    const loaded = loadState();
    dispatch({ type: 'SET_PROFILE', payload: loaded.profile });
    if (loaded.trackedThisMonth) dispatch({ type: 'SET_TRACKED', payload: loaded.trackedThisMonth });
    if (loaded.userGoals?.length) dispatch({ type: 'SET_USER_GOALS', payload: loaded.userGoals });
    if (loaded.bigPayments?.length) dispatch({ type: 'SET_BIG_PAYMENTS', payload: loaded.bigPayments });
    if (loaded.expenses?.length) dispatch({ type: 'SET_EXPENSES', payload: loaded.expenses });

    // Convex is authoritative — hydrate all blobs if a session exists.
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((session) => {
        if (!session?.user?.id) return;
        return fetch('/api/user')
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (!data) return;
            if (data.profileJson) {
              try {
                const p = JSON.parse(data.profileJson) as Profile;
                if (p?.incomes && Array.isArray(p.incomes)) dispatch({ type: 'SET_PROFILE', payload: p });
              } catch { /* ignore */ }
            }
            if (data.goalsJson) {
              try { dispatch({ type: 'SET_USER_GOALS', payload: JSON.parse(data.goalsJson) }); } catch { /* ignore */ }
            }
            if (data.bigPaymentsJson) {
              try { dispatch({ type: 'SET_BIG_PAYMENTS', payload: JSON.parse(data.bigPaymentsJson) }); } catch { /* ignore */ }
            }
            if (data.expensesJson) {
              try { dispatch({ type: 'SET_EXPENSES', payload: JSON.parse(data.expensesJson) }); } catch { /* ignore */ }
            }
          });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change (localStorage fast-path + best-effort Convex sync)
  useEffect(() => {
    saveState(state);
    // Best-effort server sync — only fires if a session exists
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((session) => {
        if (!session?.user?.id) return;
        return fetch('/api/user', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            profileJson: JSON.stringify(state.profile),
            goalsJson: JSON.stringify(state.userGoals),
            bigPaymentsJson: JSON.stringify(state.bigPayments),
            expensesJson: JSON.stringify(state.expenses),
          }),
        });
      })
      .catch(() => {}); // Silently ignore failures
  }, [state]);

  const plan = computePlan(state.profile, state.trackedThisMonth, state.bigPayments, state.userGoals, state.expenses);

  const store: PlanStore = {
    profile: state.profile,
    plan,
    setProfile: (p) => dispatch({ type: 'SET_PROFILE', payload: p }),
    addIncome: (i) => dispatch({ type: 'ADD_INCOME', payload: i }),
    addBigPayment: (p) => dispatch({ type: 'ADD_BIG_PAYMENT', payload: p }),
    addExpense: (e) => dispatch({ type: 'ADD_EXPENSE', payload: e }),
    expenses: state.expenses,
    setPaycheck: (n) => dispatch({ type: 'SET_PAYCHECK', payload: n }),
    setTracked: (n) => dispatch({ type: 'SET_TRACKED', payload: n }),
    setUserGoals: (goals) => dispatch({ type: 'SET_USER_GOALS', payload: goals }),
    reset: () => dispatch({ type: 'RESET' }),
  };

  return React.createElement(PlanContext.Provider, { value: store }, children);
}

export function usePlan(): PlanStore {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside <PlanProvider>');
  return ctx;
}
