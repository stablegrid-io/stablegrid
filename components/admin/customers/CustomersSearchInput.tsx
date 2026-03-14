import { Search } from 'lucide-react';

export function CustomersSearchInput({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block w-full max-w-md">
      <span className="sr-only">Search customers</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f857c]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search customers..."
        className="h-11 w-full rounded-[14px] border border-white/10 bg-[#0a1110] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-[#6f857c] focus:border-brand-400/35 focus:ring-2 focus:ring-brand-400/15"
      />
    </label>
  );
}
