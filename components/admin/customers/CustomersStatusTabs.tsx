import type { StatusFilter } from '@/components/admin/customers/types';

const OPTIONS: StatusFilter[] = ['All', 'Active', 'Inactive'];
const ACCENT = '153,247,255';

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
            className="h-9 px-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
            style={{
              borderRadius: 10,
              background: active ? `rgba(${ACCENT},0.14)` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${active ? `rgba(${ACCENT},0.4)` : 'rgba(255,255,255,0.1)'}`,
              color: active ? `rgb(${ACCENT})` : 'rgba(255,255,255,0.78)',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold whitespace-nowrap">
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}
