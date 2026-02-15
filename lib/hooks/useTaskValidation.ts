'use client';

export function useTaskValidation() {
  return {
    validateTask: async (..._args: unknown[]) => ({
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
