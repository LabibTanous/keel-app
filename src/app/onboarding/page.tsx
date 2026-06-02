import type { Metadata } from 'next';
import { OnboardingClient } from './OnboardingClient';

export const metadata: Metadata = {
  title: 'Get Started — Keel',
  description: 'Set up your income profile to start smoothing your finances.',
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
