import { describe, expect, it } from 'vitest';
import { getPasswordIssues, isPasswordStrong } from '@/lib/utils/password';

describe('password validation', () => {
  it('marks strong passwords correctly', () => {
    expect(isPasswordStrong('Aa1!aaaa')).toBe(true);
  });

  it('returns all missing issues for weak password', () => {
    const issues = getPasswordIssues('abc');
    expect(issues).toContain('At least 8 characters');
    expect(issues).toContain('One uppercase letter');
    expect(issues).toContain('One number');
    expect(issues).toContain('One symbol');
  });

  it('returns no issues for valid password', () => {
    expect(getPasswordIssues('Aa1!aaaa')).toHaveLength(0);
  });
});
