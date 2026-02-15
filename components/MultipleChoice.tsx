'use client';

interface MultipleChoiceProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function MultipleChoice({ options, value, onChange }: MultipleChoiceProps) {
  return (
    <div className="grid gap-3">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
              selected
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                : 'border-light-border bg-light-bg text-text-light-secondary hover:border-brand-300 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary dark:hover:border-brand-700'
            }`}
            aria-pressed={selected}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
