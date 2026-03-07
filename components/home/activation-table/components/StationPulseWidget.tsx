'use client';

import { motion } from 'framer-motion';
import { LightbulbPulseFeedback } from '@/components/feedback/LightbulbPulseFeedback';
import { ACTIVATION_EASE_OUT } from '@/components/home/activation-table/state/activationTimings';

interface StationPulseWidgetProps {
  visible: boolean;
}

export const StationPulseWidget = ({ visible }: StationPulseWidgetProps) => {
  if (!visible) {
    return null;
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: ACTIVATION_EASE_OUT }}
      className="fixed right-3 top-24 z-50 w-[min(360px,calc(100vw-1.5rem))] sm:right-6 sm:w-[340px]"
      aria-label="Station feedback widget"
    >
      <LightbulbPulseFeedback
        contextType="general"
        contextId="home-dashboard"
        prompt="Station pulse"
        dismissWhenSelected
        className="border-dark-border/85 bg-[#0b1014]/95 shadow-[0_22px_60px_-34px_rgba(0,0,0,0.8)] backdrop-blur"
      />
    </motion.aside>
  );
};
