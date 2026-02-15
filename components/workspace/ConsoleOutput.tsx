'use client';

import { useEffect, useRef } from 'react';

interface ConsoleOutputProps {
  lines: string[];
}

export function ConsoleOutput({ lines }: ConsoleOutputProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-muted">
      <div className="border-b border-light-border px-4 py-3 dark:border-dark-border">
        <p className="data-mono text-xs uppercase tracking-[0.2em] text-text-light-tertiary dark:text-text-dark-tertiary">
          Console Output
        </p>
      </div>
      <div
        ref={containerRef}
        className="scrollbar-slim flex-1 space-y-2 overflow-auto px-4 py-3 text-xs text-text-light-secondary dark:text-text-dark-secondary"
      >
        {lines.length === 0 ? (
          <p className="text-text-light-muted dark:text-text-dark-muted">
            {'>>'} Waiting for execution...
          </p>
        ) : (
          lines.map((line, index) => {
            const isError = line.startsWith('ERR:');
            const isSystem = line.startsWith('SYS:');
            const cleanLine = line.replace(/^ERR:|^SYS:/, '').trim();
            return (
              <p
                key={`${line}-${index}`}
                className={
                  isError
                    ? 'text-error-600 dark:text-error-400'
                    : isSystem
                    ? 'text-warning-600 dark:text-warning-400'
                    : 'text-success-600 dark:text-success-400'
                }
              >
                {cleanLine}
              </p>
            );
          })
        )}
      </div>
    </div>
  );
}
