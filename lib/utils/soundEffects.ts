export const playSound = (src: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const audio = new Audio(src);
    audio.volume = 0.7;
    void audio.play();
  } catch (error) {
    // Ignore audio playback failures.
  }
};

export const playCorrect = () => playSound('/sounds/correct.mp3');
export const playIncorrect = () => playSound('/sounds/incorrect.mp3');
