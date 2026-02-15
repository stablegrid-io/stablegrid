'use client';

import { motion } from 'framer-motion';

interface TheoryProgressBarProps {
  progress: number;
}

export const TheoryProgressBar = ({ progress }: TheoryProgressBarProps) => {
  return (
    <div className="fixed left-0 right-0 top-0 z-[100] h-0.5 bg-light-border dark:bg-dark-border">
      <motion.div
        className="h-full bg-brand-500"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
};
