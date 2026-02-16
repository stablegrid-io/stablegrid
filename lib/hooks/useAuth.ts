'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useProgressStore } from '@/lib/stores/useProgressStore';

export const useAuth = (listen: boolean = false) => {
  const router = useRouter();
  const supabase = createClient();
  const { user, setUser, setLoading, clearAuth } = useAuthStore();
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
    setLoading,
    clearAuth,
    resetProgress
  ]);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    captchaToken: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, captchaToken })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to create account.');
      }

      return payload;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);

    if (error) {
      throw error;
    }

    return data;
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
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

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`
    });

    if (error) {
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw error;
    }
  };

  return {
    user,
    loading: useAuthStore((state) => state.loading),
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword
  };
};
