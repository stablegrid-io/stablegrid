'use client';

import { motion } from 'framer-motion';

interface TheoryProgressBarProps {
  progress: number;
}

export const TheoryProgressBar = ({ progress }: TheoryProgressBarProps) => {
  return (
    <div className="fixed left-0 right-0 top-0 z-[100] overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        style={{ height: '100%', background: '#fff', opacity: 0.85 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
};
