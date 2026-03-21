import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonColor = 'primary' | 'error' | 'tertiary';

const colorStyles: Record<ButtonColor, string> = {
  primary: 'border-primary/20 text-primary hover:bg-primary/5',
  error: 'border-error/20 text-error hover:bg-error/5',
  tertiary: 'border-tertiary/20 text-tertiary hover:bg-tertiary/5',
};

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  fullWidth?: boolean;
  children: ReactNode;
}

export function GhostButton({
  color = 'primary',
  fullWidth = false,
  children,
  className = '',
  ...props
}: GhostButtonProps) {
  return (
    <button
      className={`border bg-transparent font-headline font-bold text-xs py-4 px-6 tracking-widest uppercase active:scale-[0.98] transition-all ${colorStyles[color]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
