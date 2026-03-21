'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type { editor } from 'monaco-editor';
import { Button } from '@/components/ui/Button';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'python' | 'sql';
  onLanguageChange: (language: 'python' | 'sql') => void;
  storageKey: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  storageKey
}: CodeEditorProps) {
  const monacoTheme = 'vs-dark';
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const saved = window.localStorage.getItem(storageKey);
    if (saved && saved.trim().length > 0) {
      onChange(saved);
    }
    setIsReady(true);
  }, [storageKey, onChange]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const interval = window.setInterval(() => {
      window.localStorage.setItem(storageKey, value);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [storageKey, value]);

  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily: 'var(--font-mono)',
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto'
      },
      padding: { top: 16 }
    }),
    []
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-muted">
      <div className="flex items-center justify-between border-b border-light-border px-4 py-3 dark:border-dark-border">
        <div className="data-mono text-xs uppercase tracking-[0.2em] text-text-light-tertiary dark:text-text-dark-tertiary">
          Live Editor
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={language === 'python' ? 'primary' : 'ghost'}
            onClick={() => onLanguageChange('python')}
          >
            Python
          </Button>
          <Button
            type="button"
            variant={language === 'sql' ? 'primary' : 'ghost'}
            onClick={() => onLanguageChange('sql')}
          >
            SQL
          </Button>
        </div>
      </div>
      <div className="flex-1">
        {isReady ? (
          <MonacoEditor
            theme={monacoTheme}
            language={language}
            value={value}
            onChange={(nextValue) => onChange(nextValue ?? '')}
            options={options}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            Loading editor...
          </div>
        )}
      </div>
    </div>
  );
}
