import { Search } from 'lucide-react';

export function CustomersSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
        strokeWidth={1.75}
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search customers"
        aria-label="Search customers"
        className="h-9 w-full pl-9 pr-3 border border-surface-dim bg-surface-container-low font-body text-[13px] text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
