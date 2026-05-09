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
      <div className="flex min-h-[200px] items-center justify-center font-ui-label text-[12px] uppercase tracking-wider text-on-surface-variant">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
