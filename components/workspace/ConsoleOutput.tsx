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
    <div className="flex h-full flex-col border border-surface-dim bg-surface-container">
      <div className="border-b border-surface-dim px-4 py-3">
        <p className="data-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant">
          Console Output
        </p>
      </div>
      <div
        ref={containerRef}
        className="scrollbar-slim flex-1 space-y-2 overflow-auto px-4 py-3 text-xs text-on-surface-variant"
      >
        {lines.length === 0 ? (
          <p className="text-on-surface-variant">
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
                    ? 'text-error-600 '
                    : isSystem
                    ? 'text-warning-600 '
                    : 'text-success-600 '
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
