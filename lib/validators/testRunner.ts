'use client';

import type { Question } from '@/lib/types';
import type { PyodideRunResult } from '@/lib/hooks/usePyodide';

interface RunCodeTestsOptions {
  question: Question;
  answer: string;
  runPython?: (code: string) => Promise<PyodideRunResult>;
}

export async function runCodeTests({
  question,
  answer,
  runPython
}: RunCodeTestsOptions): Promise<PyodideRunResult> {
  if (question.type !== 'code') {
    return { success: true };
  }

  if (question.topic === 'python' && runPython) {
    return runPython(answer);
  }

  return { success: true };
}
