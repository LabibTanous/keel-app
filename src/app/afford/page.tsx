import type { Metadata } from 'next';
import { AffordClient } from './AffordClient';

export const metadata: Metadata = {
  title: 'Can I Afford This? — Keel',
  description: 'Check any purchase against your monthly plan.',
};

export default function AffordPage() {
  return <AffordClient />;
}
