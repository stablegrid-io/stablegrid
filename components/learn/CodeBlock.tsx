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

const IMPORT_LINE_PATTERN = /^(from\s+\S+\s+import|import\s+)/;
const DISPLAY_LINE_PATTERN = /^(display|print)\s*\(|\.\s*show\s*\(/;
const ASSIGNMENT_LINE_PATTERN = /^[A-Za-z_][\w.]*\s*=/;
const CONTROL_LINE_PATTERN =
  /^(if|elif|else|for|while|try|except|finally|with|def|class)\b/;
const COMMENT_LINE_PATTERN = /^#/;

const trimCodeLine = (line: string) => line.trim();

const shouldAddVisualGap = (previousLine: string, currentLine: string) => {
  const previous = trimCodeLine(previousLine);
  const current = trimCodeLine(currentLine);

  if (!previous || !current) return false;
  if (IMPORT_LINE_PATTERN.test(previous) && !IMPORT_LINE_PATTERN.test(current)) {
    return true;
  }
  if (DISPLAY_LINE_PATTERN.test(previous) && ASSIGNMENT_LINE_PATTERN.test(current)) {
    return true;
  }
  if (COMMENT_LINE_PATTERN.test(current) && !COMMENT_LINE_PATTERN.test(previous)) {
    return true;
  }
  if (CONTROL_LINE_PATTERN.test(current) && !CONTROL_LINE_PATTERN.test(previous)) {
    return true;
  }

  return false;
};

const tokenClass = (type: string) => {
  if (type === 'comment') return 'text-slate-500 dark:text-slate-500';
  if (type === 'string') return 'text-emerald-700 dark:text-emerald-300';
  if (type === 'number') return 'text-slate-600 dark:text-slate-300';
  if (type === 'decorator') return 'text-violet-700 dark:text-violet-300';
  if (type === 'keyword') return 'font-medium text-violet-700 dark:text-violet-300';
  if (type === 'function') return 'text-slate-600 dark:text-slate-300';
  return 'text-slate-900 dark:text-slate-200';
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
  const codeLines = code.split('\n');
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
    <div className="overflow-hidden rounded-xl border border-slate-300/70 bg-[#f8fafc] shadow-sm dark:border-[rgba(148,163,184,0.1)] dark:bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-slate-300/70 bg-slate-100 px-4 py-2.5 dark:border-[rgba(148,163,184,0.1)] dark:bg-[rgba(148,163,184,0.05)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-error-400" />
            <span className="h-3 w-3 rounded-full bg-warning-400" />
            <span className="h-3 w-3 rounded-full bg-success-400" />
          </div>
          <span className="ml-1 rounded-full border border-slate-400/60 bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:border-slate-500/40 dark:bg-slate-500/15 dark:text-slate-300">
            {detectedLanguage}
          </span>
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

      <div className="overflow-x-auto bg-[#f8fafc] px-3 py-3 dark:bg-[#0d1117]">
        <pre className="font-mono text-sm text-slate-900 dark:text-slate-200">
          <code>
            {codeLines.map((line, index) => {
              const previousLine = index > 0 ? codeLines[index - 1] : '';
              const addGroupGap = shouldAddVisualGap(previousLine, line);

              return (
                <span
                  key={`${index}-${line.slice(0, 10)}`}
                  className={`grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-4 px-1 ${
                    addGroupGap ? 'mt-2' : ''
                  }`}
                >
                  <span className="select-none text-right text-[11px] leading-7 text-slate-500 dark:text-slate-500">
                    {index + 1}
                  </span>
                  <span className="block whitespace-pre text-[13px] leading-7 tracking-[0.01em] text-slate-900 dark:text-slate-200">
                    {highlightRegex
                      ? highlightLine(line, highlightRegex, `line-${index}`)
                      : line}
                  </span>
                </span>
              );
            })}
          </code>
        </pre>
      </div>

      {output ? (
        <div className="border-t border-slate-300/70 dark:border-[rgba(148,163,184,0.1)]">
          <div className="bg-slate-100 px-4 py-1.5 dark:bg-slate-800/30">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Output
            </span>
          </div>
          <div className="overflow-x-auto bg-[#f8fafc] p-4 dark:bg-[#0d1117]">
            <pre className="text-xs text-slate-700 dark:text-slate-300">
              {output}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
};
