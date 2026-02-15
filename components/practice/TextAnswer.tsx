'use client';

interface TextAnswerProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export const TextAnswer = ({
  value,
  onChange,
  disabled,
  placeholder
}: TextAnswerProps) => {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="min-h-[120px] w-full resize-none rounded-lg border border-light-border bg-light-bg p-4 text-text-light-primary transition-colors placeholder:text-text-light-tertiary focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder:text-text-dark-tertiary"
    />
  );
};
