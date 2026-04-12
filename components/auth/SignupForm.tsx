'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Signup is now handled via OAuth (Google/GitHub) on the login page.
 * This component redirects to /login.
 */
export function SignupForm() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
}
