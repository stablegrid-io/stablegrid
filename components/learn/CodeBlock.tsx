'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  label?: string;
  output?: string;
}

export const CodeBlock = ({ code, label, output }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-light-border dark:border-dark-border">
      <div className="flex items-center justify-between border-b border-light-border bg-light-surface px-4 py-2 dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-error-400" />
            <span className="h-3 w-3 rounded-full bg-warning-400" />
            <span className="h-3 w-3 rounded-full bg-success-400" />
          </div>
          {label ? (
            <span className="ml-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              {label}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text-light-tertiary transition-colors hover:text-text-light-primary dark:text-text-dark-tertiary dark:hover:text-text-dark-primary"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success-500" />
              <span className="text-success-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto bg-light-muted p-4 dark:bg-dark-muted">
        <pre className="text-sm leading-relaxed text-text-light-primary dark:text-text-dark-primary">
          <code>{code}</code>
        </pre>
      </div>

      {output ? (
        <div className="border-t border-light-border dark:border-dark-border">
          <div className="bg-success-50 px-4 py-1.5 dark:bg-success-900/10">
            <span className="text-xs font-medium text-success-700 dark:text-success-400">
              Output
            </span>
          </div>
          <div className="overflow-x-auto bg-light-bg p-4 dark:bg-dark-bg">
            <pre className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {output}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
};
