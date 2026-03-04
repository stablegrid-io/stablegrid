import { expect, test } from '@playwright/test';

test.describe('theory topics page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/learn/theory', { waitUntil: 'networkidle' });
  });

  test('loads topics and opens a topic route', async ({ page }) => {
    await expect(page.getByPlaceholder('Search theory topics')).toBeVisible();

    const pysparkCard = page.locator('a[href="/learn/pyspark/theory"]').first();
    await expect(pysparkCard).toBeVisible();

    await pysparkCard.click();
    await page.waitForURL('**/learn/pyspark/theory');
    await expect(page).toHaveURL(/\/learn\/pyspark\/theory/);
  });

  test('search narrows visible topics', async ({ page }) => {
    const pysparkCard = page.locator('a[href="/learn/pyspark/theory"]');
    const fabricCard = page.locator('a[href="/learn/fabric/theory"]');

    await expect(pysparkCard.first()).toBeVisible();
    await expect(fabricCard.first()).toBeVisible();

    await page.getByPlaceholder('Search theory topics').fill('fabric');
    await expect(fabricCard.first()).toBeVisible();
    await expect(pysparkCard).toHaveCount(0);
  });
});
