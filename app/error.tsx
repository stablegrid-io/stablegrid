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
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center bg-surface">
      <p className="font-data-mono text-[12px] tracking-widest uppercase text-primary mb-2">
        Something went wrong
      </p>
      <h1 className="font-h1 text-h1 text-on-surface">
        Practice session glitch
      </h1>
      <p className="max-w-md font-body-lg text-on-surface-variant">
        Something went sideways while loading this view. Try reloading the
        session.
      </p>
      <Button type="button" onClick={reset}>
        Retry
      </Button>
    </main>
  );
}
