import type { Metadata } from 'next';
import { SignInClient } from './SignInClient';

export const metadata: Metadata = {
  title: 'Sign in — Keel',
  description: 'Sign back in to your Keel account.',
};

export default function SignInPage() {
  return <SignInClient />;
}
