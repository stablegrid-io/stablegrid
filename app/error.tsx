'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in absence of telemetry.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
        Practice session glitch
      </h1>
      <p className="max-w-md text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
        Something went sideways while loading this view. Try reloading the
        session.
      </p>
      <Button type="button" onClick={reset}>
        Retry
      </Button>
    </main>
  );
}
