'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface MultipleChoiceProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  disabled: boolean;
}

export const MultipleChoice = ({
  options,
  selected,
  onSelect,
  disabled
}: MultipleChoiceProps) => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="space-y-2">
      {options.map((option, index) => {
        const isSelected = selected === option;
        const letter = letters[index] ?? '?';

        return (
          <motion.button
            key={option}
            onClick={() => (!disabled ? onSelect(option) : undefined)}
            disabled={disabled}
            className={`w-full rounded-lg border p-4 text-left transition-all duration-150 ${
              isSelected
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-light-border bg-light-bg hover:border-brand-300 dark:border-dark-border dark:bg-dark-bg dark:hover:border-brand-700'
            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            whileHover={!disabled ? { scale: 1.005 } : undefined}
            whileTap={!disabled ? { scale: 0.995 } : undefined}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 text-xs font-medium ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-light-border text-text-light-tertiary dark:border-dark-border dark:text-text-dark-tertiary'
                }`}
              >
                {isSelected ? <Check className="h-4 w-4" /> : letter}
              </div>
              <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                {option}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
