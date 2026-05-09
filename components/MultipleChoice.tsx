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
                ? 'border-primary bg-primary-fixed text-primary-dim  '
                : 'border-surface-dim bg-surface text-on-surface-variant hover:border-primary-fixed-dim    '
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
