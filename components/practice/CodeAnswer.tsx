'use client';

import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';

interface CodeAnswerProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
  language?: 'python' | 'sql';
}

export const CodeAnswer = ({
  value,
  onChange,
  disabled,
  language = 'python'
}: CodeAnswerProps) => {
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const monacoTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';

  return (
    <div className="overflow-hidden rounded-lg border border-light-border dark:border-dark-border">
      <Editor
        height="300px"
        defaultLanguage={language}
        value={value}
        onChange={(val) => onChange(val ?? '')}
        theme={monacoTheme}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          readOnly: disabled,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true
        }}
      />
    </div>
  );
};
