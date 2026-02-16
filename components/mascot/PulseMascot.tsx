'use client';

import type { PulseAction, PulseMood, PulseMotion } from '@/types/mascot';
import { PulseMascot3D } from '@/components/mascot/PulseMascot3D';

interface PulseMascotProps {
  mood?: PulseMood;
  motion?: PulseMotion;
  action?: PulseAction;
  size?: number;
  animated?: boolean;
  interactive?: boolean;
  className?: string;
}

const MODEL_URL = process.env.NEXT_PUBLIC_PULSE_MODEL_URL;

export function PulseMascot({
  mood = 'focused',
  motion = 'flow',
  action = 'idle',
  size = 128,
  interactive = true,
  className
}: PulseMascotProps) {
  return (
    <PulseMascot3D
      mood={mood}
      motion={motion}
      action={action}
      height={Math.round(size * 1.22)}
      interactive={interactive}
      showLabel={false}
      className={className}
      modelUrl={MODEL_URL}
      title="Pulse mascot"
    />
  );
}
