import { expect, test } from '@playwright/test';

test.describe('function reference', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/learn/pyspark/functions');
  });

  test('loads function list and opens detail drawer', async ({ page }) => {
    await expect(page.getByPlaceholder('Search functions...')).toBeVisible();

    const rows = page.locator('button:has(code)');
    await expect(rows.first()).toBeVisible();
    const firstFunctionName = (await rows.first().locator('code').textContent())?.trim() ?? '';

    await rows.first().click();
    await expect(
      page.getByRole('heading', {
        name: new RegExp(firstFunctionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to list' })).toBeVisible();
  });

  test('search narrows the list', async ({ page }) => {
    const rows = page.locator('button:has(code)');
    await expect(rows.first()).toBeVisible();
    const before = await rows.count();
    expect(before).toBeGreaterThan(0);

    await page.getByPlaceholder('Search functions...').fill('sparksession');
    await page.waitForTimeout(150);

    const after = await rows.count();
    expect(after).toBeLessThanOrEqual(before);
    await expect(rows.first()).toContainText(/sparksession/i);
  });
});
