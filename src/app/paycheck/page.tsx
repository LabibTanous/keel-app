import type { Metadata } from 'next';
import { PaycheckClient } from './PaycheckClient';

export const metadata: Metadata = {
  title: 'Paycheck — Keel',
  description: 'Set and adjust your smoothed monthly paycheck.',
};

export default function PaycheckPage() {
  return <PaycheckClient />;
}
