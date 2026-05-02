import { Search } from 'lucide-react';

const ACCENT = '153,247,255';

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
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
        strokeWidth={1.75}
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search customers"
        aria-label="Search customers"
        className="h-9 w-full pl-9 pr-3 text-[13px] font-normal text-white outline-none transition-all placeholder:text-white/50"
        style={{
          borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.borderColor = `rgba(${ACCENT},0.4)`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
      />
    </div>
  );
}
