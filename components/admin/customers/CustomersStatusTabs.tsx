import type { StatusFilter } from '@/components/admin/customers/types';

const OPTIONS: StatusFilter[] = ['All', 'Active', 'Inactive'];

export function CustomersStatusTabs({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-1 shrink-0"
      role="tablist"
      aria-label="Customer status filter"
    >
      {OPTIONS.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option)}
            className={`h-9 px-3 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="font-data-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold whitespace-nowrap">
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}
