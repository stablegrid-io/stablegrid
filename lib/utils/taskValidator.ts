import type { TestCase } from '@/lib/types';

export async function evaluateTestCases(
  pyodide: any,
  testCases: TestCase[]
): Promise<{ testsPassed: number; totalTests: number; failures: string[] }> {
  let testsPassed = 0;
  const failures: string[] = [];

  for (const testCase of testCases) {
    try {
      const result = await pyodide.runPythonAsync(testCase.check);
      const passed = Boolean(result);
      if (passed) {
        testsPassed += 1;
      } else {
        failures.push(testCase.message);
      }
    } catch (error) {
      failures.push(testCase.message);
    }
  }

  return { testsPassed, totalTests: testCases.length, failures };
}
