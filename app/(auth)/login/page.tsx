import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Log in · stableGrid',
};

export default function LoginPage() {
  return <LoginForm />;
}
