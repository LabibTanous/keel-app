'use client';

/**
 * store.ts — Keel's single source of truth.
 * React Context + localStorage persistence.
 * Pure derivation: every Profile change triggers a full engine recompute.
 */

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { IncomeItem, Profile, IncomeRange, Allocation, Signal } from './engine';
import {
  toAED,
  groupByMonth,
  computeRange,
  computePaycheck,
  computeAllocation,
  computeRunway,
  computeOutlook,
  detectSignals,
} from './engine';
import { DEMO_PROFILE } from './demo-seed';

export type { Profile, IncomeItem };

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
}

// ── Store interface ───────────────────────────────────────────────────────────

export interface PlanStore {
  profile: Profile;
  plan: Plan;
  setProfile: (p: Profile) => void;
  addIncome: (i: IncomeItem) => void;
  setPaycheck: (n: number) => void;
  setTracked: (n: number) => void;
  reset: () => void;
}

// ── Pure plan derivation ──────────────────────────────────────────────────────

export function computePlan(profile: Profile, trackedThisMonth = 0): Plan {
  const monthlyTotals = groupByMonth(profile.incomes);
  const range = computeRange(monthlyTotals);

  const rawPaycheck = profile.paycheckOverride !== undefined
    ? profile.paycheckOverride
    : computePaycheck(range, profile.essentials, profile.bufferBalance);

  const allocation = computeAllocation(
    rawPaycheck,
    profile.essentials,
    profile.region,
    profile.zakatOn,
    profile.zakatableWealth ?? 0,
    profile.bufferBalance,
    profile.targetMonths,
  );

  const runway = computeRunway(profile.bufferBalance, profile.essentials);
  const outlook = computeOutlook(trackedThisMonth, range.likely);
  const signals = detectSignals(range, allocation, trackedThisMonth);

  // YTD tax turnover: sum all incomes in current calendar year
  const thisYear = new Date().getFullYear().toString();
  const taxTurnover = profile.incomes
    .filter(i => i.date.startsWith(thisYear))
    .reduce((sum, i) => sum + toAED(i.amount, i.currency), 0);

  return {
    range,
    paycheck: rawPaycheck,
    allocation,
    runway,
    signals,
    outlook,
    trackedThisMonth,
    taxTurnover,
  };
}

// ── State & reducer ───────────────────────────────────────────────────────────

interface State {
  profile: Profile;
  trackedThisMonth: number;
}

type Action =
  | { type: 'SET_PROFILE'; payload: Profile }
  | { type: 'ADD_INCOME'; payload: IncomeItem }
  | { type: 'SET_PAYCHECK'; payload: number }
  | { type: 'SET_TRACKED'; payload: number }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'ADD_INCOME':
      return {
        ...state,
        profile: {
          ...state.profile,
          incomes: [...state.profile.incomes, action.payload],
        },
      };
    case 'SET_PAYCHECK':
      return {
        ...state,
        profile: { ...state.profile, paycheckOverride: action.payload },
      };
    case 'SET_TRACKED':
      return { ...state, trackedThisMonth: action.payload };
    case 'RESET':
      return { profile: DEMO_PROFILE, trackedThisMonth: 0 };
    default:
      return state;
  }
}

const STORAGE_KEY = 'keel_plan_state_v1';

function loadState(): State {
  if (typeof window === 'undefined') {
    return { profile: DEMO_PROFILE, trackedThisMonth: 0 };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      // Basic validation: must have profile with incomes array
      if (parsed?.profile?.incomes && Array.isArray(parsed.profile.incomes)) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors — fall through to defaults
  }
  return { profile: DEMO_PROFILE, trackedThisMonth: 0 };
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
  // Always start with DEMO_PROFILE so SSR and first client render match.
  // After mount, hydrate from localStorage to avoid React hydration mismatch.
  const [state, dispatch] = useReducer(reducer, { profile: DEMO_PROFILE, trackedThisMonth: 0 });

  // On first client mount, load persisted state (runs only in the browser)
  useEffect(() => {
    const loaded = loadState();
    dispatch({ type: 'SET_PROFILE', payload: loaded.profile });
    if (loaded.trackedThisMonth) dispatch({ type: 'SET_TRACKED', payload: loaded.trackedThisMonth });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const plan = computePlan(state.profile, state.trackedThisMonth);

  const store: PlanStore = {
    profile: state.profile,
    plan,
    setProfile: (p) => dispatch({ type: 'SET_PROFILE', payload: p }),
    addIncome: (i) => dispatch({ type: 'ADD_INCOME', payload: i }),
    setPaycheck: (n) => dispatch({ type: 'SET_PAYCHECK', payload: n }),
    setTracked: (n) => dispatch({ type: 'SET_TRACKED', payload: n }),
    reset: () => dispatch({ type: 'RESET' }),
  };

  return React.createElement(PlanContext.Provider, { value: store }, children);
}

export function usePlan(): PlanStore {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside <PlanProvider>');
  return ctx;
}
