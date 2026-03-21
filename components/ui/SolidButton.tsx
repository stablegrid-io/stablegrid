import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonColor = 'primary' | 'error' | 'tertiary';

const colorStyles: Record<ButtonColor, string> = {
  primary: 'bg-primary text-on-primary hover:shadow-[0_0_20px_rgba(153,247,255,0.4)]',
  error: 'bg-error text-on-error hover:shadow-[0_0_20px_rgba(255,113,108,0.4)]',
  tertiary: 'bg-tertiary text-on-tertiary hover:shadow-[0_0_20px_rgba(255,201,101,0.4)]',
};

interface SolidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  fullWidth?: boolean;
  children: ReactNode;
}

export function SolidButton({
  color = 'primary',
  fullWidth = false,
  children,
  className = '',
  ...props
}: SolidButtonProps) {
  return (
    <button
      className={`font-headline font-black text-xs py-4 px-6 tracking-widest uppercase active:scale-[0.98] transition-all ${colorStyles[color]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
