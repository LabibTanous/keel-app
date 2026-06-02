import type { Metadata } from 'next';
import { TaxClient } from './TaxClient';

export const metadata: Metadata = {
  title: 'Tax — Keel',
  description: 'Track your tax obligations and set-aside progress.',
};

export default function TaxPage() {
  return <TaxClient />;
}
