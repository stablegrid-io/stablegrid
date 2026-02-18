'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import type { Task } from '@/lib/types';
import { BriefPanel } from '@/components/workspace/BriefPanel';
import { CodeEditor } from '@/components/workspace/CodeEditor';
import { ConsoleOutput } from '@/components/workspace/ConsoleOutput';
import { DeployButton } from '@/components/workspace/DeployButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useTaskValidation } from '@/lib/hooks/useTaskValidation';
import { useUserStore } from '@/lib/stores/useUserStore';

interface WorkspaceClientProps {
  task: Task;
}

export function WorkspaceClient({ task }: WorkspaceClientProps) {
  const [code, setCode] = useState(task.starterCode);
  const [language, setLanguage] = useState<'python' | 'sql'>('python');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const { completedTasks } = useUserStore();
  const {
    validateTask,
    isRunning,
    lastResult,
    consoleOutput,
    error,
    isLoading
  } = useTaskValidation();

  const isCompleted = completedTasks.includes(task.id);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const timerLabel = useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [elapsedSeconds]);

  return (
    <main className="min-h-screen px-4 pb-8 pt-8 md:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <Link
              href="/missions"
              className="data-mono inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-text-light-tertiary hover:text-brand-500 dark:text-text-dark-tertiary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Hub
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary md:text-3xl">
                {task.title}
              </h1>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {task.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={isCompleted ? 'success' : 'warning'}>
              {isCompleted ? 'Completed' : 'In Progress'}
            </Badge>
            <div className="flex items-center gap-2 rounded-full border border-light-border bg-light-muted px-4 py-2 text-xs text-text-light-secondary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-secondary">
              <Clock className="h-4 w-4" />
              {timerLabel}
            </div>
            <DeployButton
              isRunning={isRunning || isLoading}
              onDeploy={() => validateTask(task, code)}
            />
          </div>
        </header>

        <div className="sr-only" aria-live="polite">
          {lastResult?.success ? 'Mission Complete!' : ''}
        </div>

        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/10 dark:text-error-400">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="rounded-lg border border-light-border bg-light-muted px-4 py-3 text-sm text-text-light-secondary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-secondary">
            Loading Python runtime and mission datasets...
          </div>
        )}

        {lastResult && (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
              lastResult.success
                ? 'border-success-200 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-900/10 dark:text-success-300'
                : 'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-900/10 dark:text-warning-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {lastResult.success
                ? 'Mission Complete! Rewards deposited.'
                : 'Mission incomplete. Review failed checks.'}
            </div>
            <div className="data-mono text-xs">
              Tests: {lastResult.testsPassed}/{lastResult.totalTests} |{' '}
              {lastResult.executionTime.toFixed(0)}ms
            </div>
          </div>
        )}

        {lastResult && !lastResult.success && lastResult.failures.length > 0 && (
          <div className="rounded-lg border border-light-border bg-light-muted px-4 py-3 text-sm text-text-light-secondary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-secondary">
            <p className="data-mono text-xs uppercase tracking-[0.2em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Failed Checks
            </p>
            <ul className="mt-2 space-y-1">
              {lastResult.failures.map((failure) => (
                <li key={failure}>• {failure}</li>
              ))}
            </ul>
          </div>
        )}

        <PanelGroup
          direction="horizontal"
          className="hidden lg:flex lg:min-h-[70vh]"
        >
          <Panel defaultSize={30} minSize={24}>
            <BriefPanel task={task} />
          </Panel>
          <PanelResizeHandle className="mx-2 w-2 rounded-full bg-light-hover hover:bg-light-active dark:bg-dark-hover dark:hover:bg-dark-active" />
          <Panel defaultSize={70} minSize={40}>
            <PanelGroup direction="vertical" className="flex h-full flex-col">
              <Panel defaultSize={70} minSize={45}>
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  onLanguageChange={setLanguage}
                  storageKey={`stablegrid-code-${task.id}`}
                />
              </Panel>
              <PanelResizeHandle className="my-2 h-2 rounded-full bg-light-hover hover:bg-light-active dark:bg-dark-hover dark:hover:bg-dark-active" />
              <Panel defaultSize={30} minSize={20}>
                <ConsoleOutput lines={consoleOutput} />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>

        <div className="flex flex-col gap-4 lg:hidden">
          <BriefPanel task={task} />
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            onLanguageChange={setLanguage}
            storageKey={`stablegrid-code-${task.id}`}
          />
          <div className="h-64">
            <ConsoleOutput lines={consoleOutput} />
          </div>
          <div className="card flex items-center justify-between p-4">
            <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              Need a quick reset?
            </div>
            <Button variant="ghost" onClick={() => setCode(task.starterCode)}>
              Reset Code
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
