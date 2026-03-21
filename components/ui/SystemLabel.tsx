import type { ReactNode } from 'react';

type LabelColor = 'primary' | 'secondary' | 'tertiary' | 'error';

const textColorMap: Record<LabelColor, string> = {
  primary: 'text-primary/60',
  secondary: 'text-secondary/60',
  tertiary: 'text-tertiary/60',
  error: 'text-error/60',
};

const dotColorMap: Record<LabelColor, string> = {
  primary: 'bg-primary shadow-[0_0_5px_#99f7ff]',
  secondary: 'bg-secondary shadow-[0_0_5px_#bf81ff]',
  tertiary: 'bg-tertiary shadow-[0_0_5px_#ffc965]',
  error: 'bg-error shadow-[0_0_5px_#ff716c]',
};

interface SystemLabelProps {
  color?: LabelColor;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function SystemLabel({
  color = 'primary',
  dot = false,
  className = '',
  children,
}: SystemLabelProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {dot && <div className={`w-1.5 h-1.5 ${dotColorMap[color]}`} />}
      <span className={`font-mono text-[10px] ${textColorMap[color]} tracking-widest uppercase`}>
        {children}
      </span>
    </div>
  );
}
