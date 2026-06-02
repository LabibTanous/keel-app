import type { Metadata } from 'next';
import { ImportClient } from './ImportClient';

export const metadata: Metadata = {
  title: 'Import — Keel',
  description: 'Import your bank transactions into Keel.',
};

export default function ImportPage() {
  return <ImportClient />;
}
