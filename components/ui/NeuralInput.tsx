import type { InputHTMLAttributes } from 'react';

interface NeuralInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function NeuralInput({ className = '', ...props }: NeuralInputProps) {
  return (
    <input
      className={`bg-surface-container-low border-b border-outline-variant/30 text-[10px] font-mono text-primary py-1 px-4 focus:outline-none focus:border-primary transition-all placeholder:text-primary/20 ${className}`}
      {...props}
    />
  );
}
