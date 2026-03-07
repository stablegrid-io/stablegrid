'use client';

import { motion } from 'framer-motion';
import type { RefObject } from 'react';
import { LearningRouteMap } from '@/components/home/entry/LearningRouteMap';
import { ENTRY_EASE_OUT } from '@/components/home/entry/motionTokens';
import type { LearningRouteMapData } from '@/components/home/entry/types';

interface WorkspaceRevealProps {
  isVisible: boolean;
  isReady: boolean;
  map: LearningRouteMapData;
  containerRef: RefObject<HTMLDivElement>;
}

const revealVariants = {
  hidden: {
    opacity: 0,
    y: 24
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: ENTRY_EASE_OUT,
      staggerChildren: 0.08
    }
  }
} as const;

const childVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: ENTRY_EASE_OUT } }
} as const;

export const WorkspaceReveal = ({
  isVisible,
  isReady,
  map,
  containerRef
}: WorkspaceRevealProps) => {
  return (
    <motion.div
      ref={containerRef}
      data-testid="workspace-reveal"
      data-ready={isReady ? 'true' : 'false'}
      initial={false}
      animate={isVisible ? 'visible' : 'hidden'}
      variants={revealVariants}
      className={isReady ? 'pointer-events-auto' : 'pointer-events-none'}
    >
      <motion.div variants={childVariants}>
        <LearningRouteMap data={map} />
      </motion.div>
    </motion.div>
  );
};
