import type { Metadata } from 'next';
import { ProfileClient } from './ProfileClient';

export const metadata: Metadata = {
  title: 'Profile — Keel',
  description: 'Manage your Keel profile and financial preferences.',
};

export default function ProfilePage() {
  return <ProfileClient />;
}
