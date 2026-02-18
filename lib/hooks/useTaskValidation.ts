'use client';

import type { ExecutionResult, Task } from '@/lib/types';

interface UseTaskValidationResult {
  validateTask: (task: Task, code: string) => Promise<ExecutionResult>;
  isRunning: boolean;
  lastResult: ExecutionResult | null;
  consoleOutput: string[];
  error: string | null;
  isLoading: boolean;
}

export function useTaskValidation(): UseTaskValidationResult {
  return {
    validateTask: async (_task: Task, _code: string) => ({
      success: false,
      output: '',
      testsPassed: 0,
      totalTests: 0,
      executionTime: 0,
      failures: ['Legacy module disabled.']
    }),
    isRunning: false,
    lastResult: null,
    consoleOutput: [],
    error: null,
    isLoading: false
  };
}
