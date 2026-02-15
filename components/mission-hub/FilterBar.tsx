'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface FilterBarProps {
  industries: string[];
  skills: string[];
  selectedIndustry: string | null;
  selectedSkills: string[];
  onIndustryChange: (value: string | null) => void;
  onSkillToggle: (skill: string) => void;
  onClear: () => void;
}

export function FilterBar({
  industries,
  skills,
  selectedIndustry,
  selectedSkills,
  onIndustryChange,
  onSkillToggle,
  onClear
}: FilterBarProps) {
  return (
    <div className="card flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="data-mono text-xs uppercase tracking-[0.3em] text-text-light-tertiary dark:text-text-dark-tertiary">
            Filters
          </p>
          <h2 className="text-xl font-semibold">Focus your intel</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Industry
            <select
              value={selectedIndustry ?? ''}
              onChange={(event) =>
                onIndustryChange(event.target.value || null)
              }
              className="rounded-full border border-light-border bg-light-bg px-3 py-2 text-sm text-text-light-primary focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary"
              aria-label="Filter by industry"
            >
              <option value="">All</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" variant="ghost" onClick={onClear}>
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => {
          const isActive = selectedSkills.includes(skill);
          return (
            <button
              key={skill}
              onClick={() => onSkillToggle(skill)}
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                isActive
                  ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                  : 'border-light-border bg-light-muted text-text-light-tertiary hover:border-brand-300 hover:text-text-light-primary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-tertiary dark:hover:border-brand-700 dark:hover:text-text-dark-primary'
              }`}
              aria-pressed={isActive}
              aria-label={`Toggle ${skill} filter`}
            >
              {skill}
            </button>
          );
        })}
        {skills.length === 0 && (
          <Badge tone="warning">No skills detected</Badge>
        )}
      </div>
    </div>
  );
}
