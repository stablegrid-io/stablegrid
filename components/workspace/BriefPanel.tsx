'use client';

import type { Task } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface BriefPanelProps {
  task: Task;
}

export function BriefPanel({ task }: BriefPanelProps) {
  return (
    <aside className="card flex h-full flex-col gap-6 p-6">
      <div>
        <Badge tone="success">{task.industry}</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
          {task.title}
        </h2>
        <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {task.description}
        </p>
      </div>

      <div>
        <p className="data-mono text-xs uppercase tracking-[0.2em] text-text-light-tertiary dark:text-text-dark-tertiary">
          Client Briefing
        </p>
        <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {task.briefing}
        </p>
      </div>

      <div className="rounded-lg border border-light-border bg-light-muted p-4 dark:border-dark-border dark:bg-dark-muted">
        <p className="data-mono text-xs uppercase tracking-[0.2em] text-text-light-tertiary dark:text-text-dark-tertiary">
          Data Preview
        </p>
        <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-xs text-text-light-secondary dark:text-text-dark-secondary">
{task.dataPreview}
        </pre>
      </div>

      <div>
        <p className="data-mono text-xs uppercase tracking-[0.2em] text-text-light-tertiary dark:text-text-dark-tertiary">
          Hints
        </p>
        <ul className="mt-2 space-y-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {task.hints.map((hint) => (
            <li key={hint}>• {hint}</li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        {task.skills.map((skill) => (
          <Badge key={skill}>{skill}</Badge>
        ))}
      </div>
    </aside>
  );
}
