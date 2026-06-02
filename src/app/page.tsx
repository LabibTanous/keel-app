import type { Metadata } from 'next';
import { HomeClient } from './HomeClient';

export const metadata: Metadata = {
  title: 'Keel — Financial Stability for Irregular Income',
  description: 'Budget smarter when your income changes every month.',
};

export default function WelcomePage() {
  return <HomeClient />;
}
