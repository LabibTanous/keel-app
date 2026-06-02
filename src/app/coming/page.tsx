import type { Metadata } from 'next';
import { ComingClient } from './ComingClient';

export const metadata: Metadata = {
  title: 'Income — Keel',
  description: 'Track expected income and upcoming big payments.',
};

export default function ComingPage() {
  return <ComingClient />;
}
