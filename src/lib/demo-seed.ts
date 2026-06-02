/**
 * demo-seed.ts — Keel's seed demo data.
 * This is the ONLY file where the literal seed numbers may appear.
 * Screens and engine must NOT hardcode these values directly.
 */

import type { Profile } from './engine';

export const DEMO_PROFILE: Profile = {
  region: 'AE',
  currency: 'AED',
  essentials: 6200,
  bufferBalance: 23000,
  targetMonths: 3,
  zakatOn: true,
  zakatableWealth: 60000,
  incomes: [
    { amount: 12000, currency: 'AED', date: '2025-06-01', confidence: 'likely' },
    { amount: 21000, currency: 'AED', date: '2025-05-01', confidence: 'confirmed' },
    { amount: 10000, currency: 'AED', date: '2025-04-01', confidence: 'likely' },
    { amount: 19000, currency: 'AED', date: '2025-03-01', confidence: 'confirmed' },
    { amount: 11500, currency: 'AED', date: '2025-02-01', confidence: 'likely' },
    { amount: 17000, currency: 'AED', date: '2025-01-01', confidence: 'confirmed' },
  ],
};

export const EMPTY_PROFILE: Profile = {
  region: 'AE',
  currency: 'AED',
  essentials: 0,
  bufferBalance: 0,
  targetMonths: 3,
  zakatOn: false,
  zakatableWealth: 0,
  incomes: [],
};

/** Static upcoming big payments for Goal / Coming screens. */
export interface BigPayment {
  id: string;
  m: string;       // display month label e.g. 'Jul'
  pos: number;     // timeline position 0..1
  name: string;
  amt: number;     // amount in home currency (AED)
  status: 'set' | 'saving' | 'soon';
}

export const BIG_PAYMENTS: BigPayment[] = [
  { id: 'tax', m: 'Jul', pos: 0.13, name: 'Quarterly taxes',  amt: 10500, status: 'set'    },
  { id: 'sw',  m: 'Sep', pos: 0.42, name: 'Annual software',  amt: 2000,  status: 'saving' },
  { id: 'ins', m: 'Nov', pos: 0.70, name: 'Health insurance', amt: 4800,  status: 'saving' },
  { id: 'lap', m: 'Dec', pos: 0.87, name: 'New laptop',       amt: 9000,  status: 'soon'   },
];
