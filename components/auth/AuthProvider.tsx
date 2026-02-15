'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  useAuth(true);

  return <>{children}</>;
}
