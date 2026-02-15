'use client';

import type { ReactNode } from 'react';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
