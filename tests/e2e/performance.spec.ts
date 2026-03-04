import { expect, test } from '@playwright/test';

const perfEnabled = process.env.PERF_ASSERT === '1';

test.describe('performance smoke', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.skip(!perfEnabled, 'Set PERF_ASSERT=1 to run performance assertions.');

  test('theory route transition stays under budget', async ({ page }) => {
    await page.goto('/learn/theory');

    await page.waitForLoadState('networkidle');
    await expect(page.locator('a[href="/learn/pyspark/theory"]').first()).toBeVisible();

    const start = Date.now();
    await page.locator('a[href="/learn/pyspark/theory"]').first().click();

    await page.waitForURL('**/learn/pyspark/theory');
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
  });
});
