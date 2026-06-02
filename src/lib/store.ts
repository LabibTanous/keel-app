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
  groupByMonth,
  computeRange,
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
  const monthlyTotals = groupByMonth(profile.incomes);
  const range = computeRange(monthlyTotals);

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

  // YTD tax turnover: sum all incomes in current calendar year
  const thisYear = new Date().getFullYear().toString();
  const taxTurnover = profile.incomes
    .filter(i => i.date.startsWith(thisYear))
    .reduce((sum, i) => sum + toAED(i.amount, i.currency), 0);

  const allocation = computeAllocation(
    rawPaycheck,
    profile.essentials,
    profile.region,
    profile.zakatOn,
    profile.zakatableWealth ?? 0,
    profile.bufferBalance,
    profile.targetMonths,
    taxTurnover,
  );

  const runway = computeRunway(profile.bufferBalance, profile.essentials);

  // Prorate expected pace by how far through the month we are.
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const fractionElapsed = now.getDate() / daysInMonth;

  const outlook = computeOutlook(trackedThisMonth, range.likely, fractionElapsed);
  const signals = detectSignals(range, allocation, trackedThisMonth, fractionElapsed);

  const volTrend = volatilityTrend(profile.incomes);
  const interpretations = interpret(
    { range, paycheck: rawPaycheck, allocation, runway, outlook, trackedThisMonth, taxTurnover },
    { essentials: profile.essentials, targetMonths: profile.targetMonths, region: profile.region },
    profile.incomes,
  );

  const goalTarget = profile.essentials * profile.targetMonths;
  const goalInfo = goalTradeoff(goalTarget, profile.bufferBalance, allocation.buffer, allocation.spending);

  // Monthly goal contributions
  const today = new Date();
  let monthlyGoalContrib = 0;
  for (const g of (userGoals || [])) {
    if (g.targetAmt > 0 && g.targetDate) {
      const [y, m] = g.targetDate.split('-').map(Number);
      const targetMs = new Date(y, m - 1, 1).getTime() - today.getTime();
      const monthsLeft = Math.max(1, Math.round(targetMs / (1000 * 60 * 60 * 24 * 30.44)));
      const alreadySaved = 0; // simplification — improve later
      monthlyGoalContrib += Math.round((g.targetAmt - alreadySaved) / monthsLeft);
    }
  }
  monthlyGoalContrib = Math.min(monthlyGoalContrib, Math.floor(allocation.spending * 0.4)); // cap at 40% of spending

  // Monthly big payment reserve
  let monthlyBigPaymentReserve = 0;
  for (const bp of (bigPayments || [])) {
    // assume payments need to be saved over 6 months
    monthlyBigPaymentReserve += Math.round(bp.amt / 6);
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
  | { type: 'SET_PAYCHECK'; payload: number }
  | { type: 'SET_TRACKED'; payload: number }
  | { type: 'SET_USER_GOALS'; payload: UserGoal[] }
  | { type: 'ADD_EXPENSE'; payload: ExpenseItem }
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
    if (loaded.expenses?.length) {
      for (const e of loaded.expenses) {
        dispatch({ type: 'ADD_EXPENSE', payload: e });
      }
    }

    // Try to hydrate from Convex only if a session exists.
    // localStorage is the fast-path; Convex is a background update.
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((session) => {
        if (!session?.user?.id) return; // No session — stay on localStorage, no noise
        return fetch('/api/user')
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.profileJson) {
              try {
                const serverProfile = JSON.parse(data.profileJson) as Profile;
                if (serverProfile?.incomes && Array.isArray(serverProfile.incomes)) {
                  dispatch({ type: 'SET_PROFILE', payload: serverProfile });
                }
              } catch {
                // Ignore malformed JSON
              }
            }
          });
      })
      .catch(() => {}); // No session or server error — stay on localStorage
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
          body: JSON.stringify({ profileJson: JSON.stringify(state.profile) }),
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
