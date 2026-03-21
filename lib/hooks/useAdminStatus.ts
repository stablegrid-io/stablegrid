'use client';

import { useEffect, useState } from 'react';

interface AdminStatusState {
  isAdmin: boolean;
  isLoading: boolean;
}

export const useAdminStatus = (): AdminStatusState => {
  const [state, setState] = useState<AdminStatusState>({
    isAdmin: false,
    isLoading: true
  });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const response = await fetch('/api/profile/admin-status', {
          cache: 'no-store'
        });
        if (cancelled) return;

        if (!response.ok) {
          setState({ isAdmin: false, isLoading: false });
          return;
        }

        const data = (await response.json()) as { isAdmin?: boolean };
        if (cancelled) return;

        setState({ isAdmin: Boolean(data.isAdmin), isLoading: false });
      } catch {
        if (!cancelled) {
          setState({ isAdmin: false, isLoading: false });
        }
      }
    };

    void check();
    return () => { cancelled = true; };
  }, []);

  return state;
};
