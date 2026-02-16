'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  label?: string;
  output?: string;
  language?: 'python' | 'sql' | 'text';
}

const PYTHON_KEYWORDS = [
  'import',
  'from',
  'as',
  'def',
  'class',
  'return',
  'if',
  'elif',
  'else',
  'for',
  'while',
  'try',
  'except',
  'finally',
  'with',
  'in',
  'is',
  'not',
  'and',
  'or',
  'lambda',
  'yield',
  'await',
  'async',
  'True',
  'False',
  'None',
  'pass',
  'break',
  'continue'
];

const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'FULL',
  'ON',
  'GROUP',
  'BY',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'AS',
  'DISTINCT',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'AND',
  'OR',
  'NOT',
  'IN',
  'IS',
  'NULL',
  'LIKE',
  'BETWEEN',
  'UNION',
  'ALL',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'TABLE',
  'VIEW',
  'WITH',
  'OVER',
  'PARTITION'
];

const buildTokenRegex = (keywords: string[]) =>
  new RegExp(
    [
      '(?<comment>#.*$|--.*$)',
      '(?<string>"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')',
      '(?<number>\\b\\d+(?:\\.\\d+)?\\b)',
      '(?<decorator>@[A-Za-z_]\\w*)',
      `(?<keyword>\\b(?:${keywords.join('|')})\\b)`,
      '(?<function>\\b[A-Za-z_]\\w*(?=\\s*\\())'
    ].join('|'),
    'g'
  );

const PYTHON_REGEX = buildTokenRegex(PYTHON_KEYWORDS);
const SQL_REGEX = buildTokenRegex(SQL_KEYWORDS);

const detectLanguage = (
  code: string,
  label?: string,
  explicit?: CodeBlockProps['language']
): 'python' | 'sql' | 'text' => {
  if (explicit) return explicit;

  const normalizedLabel = (label ?? '').toLowerCase();
  if (normalizedLabel.includes('sql')) return 'sql';
  if (normalizedLabel.includes('python') || normalizedLabel.includes('pyspark')) {
    return 'python';
  }

  const sqlSignals = /\b(select|from|where|join|group\s+by|order\s+by)\b/i.test(code);
  if (sqlSignals) return 'sql';

  const pythonSignals = /\b(import|def|class|spark|lambda|return)\b/.test(code);
  if (pythonSignals) return 'python';

  return 'text';
};

const tokenClass = (type: string) => {
  if (type === 'comment') return 'text-slate-500';
  if (type === 'string') return 'text-amber-300';
  if (type === 'number') return 'text-cyan-300';
  if (type === 'decorator') return 'text-violet-300';
  if (type === 'keyword') return 'text-fuchsia-300 font-medium';
  if (type === 'function') return 'text-emerald-300';
  return 'text-slate-100';
};

const highlightLine = (
  line: string,
  regex: RegExp,
  lineKey: string
): ReactNode[] => {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  regex.lastIndex = 0;

  for (const match of line.matchAll(regex)) {
    const index = match.index ?? 0;
    const token = match[0];

    if (index > lastIndex) {
      parts.push(line.slice(lastIndex, index));
    }

    const groups = match.groups ?? {};
    const type =
      Object.keys(groups).find((key) => Boolean(groups[key])) ?? 'plain';

    parts.push(
      <span key={`${lineKey}-${index}`} className={tokenClass(type)}>
        {token}
      </span>
    );

    lastIndex = index + token.length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [line];
};

export const CodeBlock = ({ code, label, output, language }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const detectedLanguage = detectLanguage(code, label, language);
  const highlightRegex =
    detectedLanguage === 'sql'
      ? SQL_REGEX
      : detectedLanguage === 'python'
        ? PYTHON_REGEX
        : null;

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

      <div className="overflow-x-auto bg-slate-950 p-4">
        <pre className="text-sm leading-relaxed text-slate-100">
          <code>
            {code.split('\n').map((line, index) => (
              <span key={`${index}-${line.slice(0, 10)}`} className="block">
                {highlightRegex
                  ? highlightLine(line, highlightRegex, `line-${index}`)
                  : line}
              </span>
            ))}
          </code>
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
