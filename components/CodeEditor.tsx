'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
      Loading editor...
    </div>
  )
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'python' | 'sql';
}

export function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const isDark = resolvedTheme !== 'light';
  const monacoTheme = isDark ? 'vs-dark' : 'light';
  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: 'var(--font-mono)',
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 }
    }),
    []
  );

  return (
    <div className="h-56 overflow-hidden rounded-lg border border-light-border bg-light-muted dark:border-dark-border dark:bg-dark-muted">
      <MonacoEditor
        theme={monacoTheme}
        language={language}
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? '')}
        options={options}
      />
    </div>
  );
}
