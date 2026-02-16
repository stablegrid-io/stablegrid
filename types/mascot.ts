export type PulseMood = 'calm' | 'focused' | 'happy' | 'alert';

export type PulseMotion = 'steady' | 'flow' | 'surge';

export type PulseAction = 'idle' | 'wave' | 'celebrate';

export interface PulseMascotConfig {
  mood: PulseMood;
  motion: PulseMotion;
}
