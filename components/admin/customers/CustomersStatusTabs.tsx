import type { StatusFilter } from '@/components/admin/customers/types';

const OPTIONS: StatusFilter[] = ['All', 'Active', 'Inactive'];

export function CustomersStatusTabs({
  value,
  onChange
}: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1"
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
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35 ${
              active
                ? 'bg-[#101716] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                : 'text-[#9db1a8] hover:text-white'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
