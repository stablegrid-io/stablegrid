import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card = ({
  children,
  hover = false,
  className = '',
  onClick
}: CardProps) => {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      onClick={onClick}
      className={`card ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      whileHover={hover ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.15 }}
    >
      {children}
    </Component>
  );
};
