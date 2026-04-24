'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useProgressStore } from '@/lib/stores/useProgressStore';

export const useAuth = (listen: boolean = false) => {
  const router = useRouter();
  const supabase = createClient();
  const { user, setUser, clearAuth } = useAuthStore();
  const { syncProgress, setUserId, resetProgress } = useProgressStore();

  useEffect(() => {
    if (!listen) {
      return;
    }

    let isMounted = true;

    const syncVerifiedUser = async () => {
      const {
        data: { user: verifiedUser }
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (verifiedUser) {
        setUser(verifiedUser);
        setUserId(verifiedUser.id);
        syncProgress(verifiedUser.id);
      } else {
        clearAuth();
        setUserId(null);
        resetProgress();
      }
    };

    void syncVerifiedUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        clearAuth();
        setUserId(null);
        resetProgress();
        return;
      }

      void syncVerifiedUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [
    listen,
    supabase,
    setUser,
    setUserId,
    syncProgress,
    clearAuth,
    resetProgress
  ]);

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    // Preserve the ?next= query param from the current URL so the OAuth
    // callback can honor it (see app/auth/callback/route.ts). Only relative
    // paths are forwarded; anything else is dropped for safety.
    let callbackUrl = `${window.location.origin}/auth/callback`;
    if (typeof window !== 'undefined') {
      const next = new URLSearchParams(window.location.search).get('next');
      if (next && /^\/[a-zA-Z0-9]/.test(next)) {
        callbackUrl += `?next=${encodeURIComponent(next)}`;
      }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl
      }
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
    setUserId(null);
    resetProgress();
    router.push('/login');
  };

  return {
    user,
    loading: useAuthStore((state) => state.loading),
    signInWithOAuth,
    signOut
  };
};
