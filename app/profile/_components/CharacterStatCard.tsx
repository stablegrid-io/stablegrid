interface Props {
  label: string;
  value: string;
  unit: string;
}

export function CharacterStatCard({ label, value, unit }: Props) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-brand-200/50">{label}</p>
      <p className="mt-1 text-xl font-bold text-brand-50">{value}</p>
      <p className="text-[9px] uppercase tracking-[0.10em] text-brand-200/40">{unit}</p>
    </div>
  );
}
