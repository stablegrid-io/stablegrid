import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign up · stablegrid',
};

export default function SignupPage() {
  redirect('/login');
}
