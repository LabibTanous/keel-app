import type { Metadata } from 'next';
import { GoalClient } from './GoalClient';

export const metadata: Metadata = {
  title: 'Saving Goal — Keel',
  description: 'Track your three-month runway buffer and saving progress.',
};

export default function GoalPage() {
  return <GoalClient />;
}
