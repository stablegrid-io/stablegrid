import { expect, test } from '@playwright/test';

const perfEnabled = process.env.PERF_ASSERT === '1';

test.describe('performance smoke', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.skip(!perfEnabled, 'Set PERF_ASSERT=1 to run performance assertions.');

  test('dashboard route transition stays under budget with skeleton', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const start = Date.now();
    await page.getByRole('link', { name: /progress/i }).click();

    await page.waitForURL('**/progress');
    await page.waitForSelector('h1:has-text("Progress")', { timeout: 10000 });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
  });
});
