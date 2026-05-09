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
        <h2 className="mt-3 text-2xl font-semibold text-on-surface">
          {task.title}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {task.description}
        </p>
      </div>

      <div>
        <p className="data-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant">
          Client Briefing
        </p>
        <p className="mt-2 text-sm text-on-surface-variant">
          {task.briefing}
        </p>
      </div>

      <div className="rounded-lg border border-surface-dim bg-surface-container-low p-4">
        <p className="data-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant">
          Data Preview
        </p>
        <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-xs text-on-surface-variant">
{task.dataPreview}
        </pre>
      </div>

      <div>
        <p className="data-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant">
          Hints
        </p>
        <ul className="mt-2 space-y-2 text-sm text-on-surface-variant">
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
