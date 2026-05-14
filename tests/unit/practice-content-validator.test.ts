// @vitest-environment node
//
// The validator does filesystem walks (node:fs); vitest's default jsdom
// env clobbers node: built-ins so neither named nor namespace imports
// resolve their methods. This test file runs in the Node env explicitly.

import { describe, expect, it } from 'vitest';
import {
  formatPracticeIssues,
  validatePracticeContent,
  type PracticeContentIssue
} from '@/lib/validators/practiceContentValidator';

const groupBy = <T, K extends string>(
  items: T[],
  key: (item: T) => K
): Record<K, T[]> => {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const k = key(item);
    (result[k] ??= []).push(item);
  }
  return result;
};

describe('practice content validator', () => {
  const issues = validatePracticeContent();
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  it('reports zero errors across all practice sets', () => {
    if (errors.length > 0) {
      const byCategory = groupBy(errors, (i) => i.category);
      const summary = Object.entries(byCategory)
        .map(([cat, list]) => `  ${cat}: ${list.length}`)
        .join('\n');
      const sample = formatPracticeIssues(errors.slice(0, 25));
      throw new Error(
        `Practice content validator found ${errors.length} errors.\n` +
          `By category:\n${summary}\n\n` +
          `First 25:\n${sample}`
      );
    }
    expect(errors).toEqual([]);
  });

  it('surfaces warnings (length-bias 1.5-2.0x) without failing', () => {
    // Informational — log totals but never fail.
    if (warnings.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`Practice content warnings: ${warnings.length}`);
    }
    expect(warnings).toBeDefined();
  });
});
