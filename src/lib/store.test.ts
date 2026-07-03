/**
 * store.test.ts — pot-ledger integration around computePlan.
 * Verifies the distribution flow the reducer drives: a received deposit splits
 * into pots (sum exact), balances accumulate, and an expense draws Spending down.
 * Engine primitives themselves are covered in engine.test.ts (Scenario P).
 */
import { describe, it, expect } from 'vitest';
import { computePlan } from './store';
import type { Profile, PotState, PotEvent } from './engine';
import { splitDeposit, foldPots, potTotal, toAED } from './engine';

const DEMO_PROFILE: Profile = {
  region: 'AE',
  currency: 'AED',
  essentials: 6200,
  bufferBalance: 23000,
  targetMonths: 3,
  zakatOn: false,
  incomes: [
    { amount: 12000, currency: 'AED', date: '2025-01-01', confidence: 'confirmed' },
    { amount: 21000, currency: 'AED', date: '2025-02-01', confidence: 'confirmed' },
    { amount: 10000, currency: 'AED', date: '2025-03-01', confidence: 'confirmed' },
    { amount: 19000, currency: 'AED', date: '2025-04-01', confidence: 'confirmed' },
    { amount: 11500, currency: 'AED', date: '2025-05-01', confidence: 'confirmed' },
    { amount: 17000, currency: 'AED', date: '2025-06-01', confidence: 'confirmed' },
  ],
};

const emptyLedger = (bufferSeed: number): PotState => ({
  version: 1,
  seed: { bills: 0, tax: 0, zakat: 0, buffer: bufferSeed, goals: 0, spending: 0 },
  events: [],
});

describe('store · pot ledger integration', () => {
  it('empty ledger: Buffer pot seeds at bufferBalance, nothing else set aside', () => {
    const plan = computePlan(DEMO_PROFILE, 0, [], [], [], emptyLedger(23000));
    expect(plan.pots.balances.buffer).toBe(23000);
    expect(plan.pots.balances.tax).toBe(0);
    expect(plan.pots.balances.spending).toBe(0);
    expect(plan.pots.total).toBe(23000);
    expect(plan.pots.routedThisMonth).toBe(0);
    // Reconciliation: runway still reads bufferBalance, not the pot.
    expect(plan.runway).toBe(3.7);
    expect(plan.pots.bufferReconcileDelta).toBe(0);
  });

  it('receiving a deposit routes it: split sums exactly, balances accumulate', () => {
    // Ratios as they stand pre-deposit — exactly what the reducer snapshots.
    const pre = computePlan(DEMO_PROFILE, 0, [], [], [], emptyLedger(23000));
    const amountAED = toAED(10000, 'AED');
    const split = splitDeposit(amountAED, pre.pots.ratios);
    expect(potTotal(split)).toBe(10000); // exact split

    const routed: PotState = {
      ...emptyLedger(23000),
      events: [{ kind: 'route', id: 'r1', date: '2025-06-10', amountAED, split }],
    };
    const plan = computePlan(DEMO_PROFILE, 0, [], [], [], routed);
    // Every pot balance grew by exactly its split share; total grew by the deposit.
    expect(plan.pots.total).toBe(23000 + 10000);
    expect(plan.pots.balances.buffer).toBe(23000 + split.buffer);
    expect(plan.pots.balances.spending).toBe(split.spending);
  });

  it('an expense draws the Spending pot down (never touches other pots)', () => {
    const amountAED = 10000;
    const split = splitDeposit(amountAED, computePlan(DEMO_PROFILE, 0, [], [], [], emptyLedger(23000)).pots.ratios);
    const events: PotEvent[] = [
      { kind: 'route', id: 'r1', date: '2025-06-10', amountAED, split },
      { kind: 'withdraw', id: 'w1', date: '2025-06-12', amountAED: 1200, pot: 'spending' },
    ];
    const plan = computePlan(DEMO_PROFILE, 0, [], [], [], { ...emptyLedger(23000), events });
    expect(plan.pots.balances.spending).toBe(split.spending - 1200);
    expect(plan.pots.balances.buffer).toBe(23000 + split.buffer); // untouched
    // Independent fold matches computePlan's derivation.
    expect(plan.pots.balances).toEqual(foldPots(events, emptyLedger(23000).seed));
  });

  it('migration default: no pots arg → Buffer pot still seeds from bufferBalance', () => {
    const plan = computePlan(DEMO_PROFILE); // no pots passed → migratePots seeds buffer
    expect(plan.pots.balances.buffer).toBe(23000);
    expect(plan.pots.total).toBe(23000);
  });
});
