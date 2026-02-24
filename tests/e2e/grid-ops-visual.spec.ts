import { expect, test } from '@playwright/test';

const E2E_EMAIL = process.env.STABLEGRID_E2E_EMAIL ?? '';
const E2E_PASSWORD = process.env.STABLEGRID_E2E_PASSWORD ?? '';
const ENABLE_VISUAL_BASELINE = process.env.GRID_VISUAL_BASELINE === '1';

test.describe('grid ops visual desktop baseline', () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'Set e2e credentials to run visual snapshot tests.');
  test.skip(!ENABLE_VISUAL_BASELINE, 'Set GRID_VISUAL_BASELINE=1 to run snapshot comparisons.');

  test('desktop scene baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });

    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.getByLabel('Email').fill(E2E_EMAIL);
    await page.locator('#login-password').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });

    await page.goto('/energy', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-grid-scene="2p5d"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('main')).toHaveScreenshot('grid-ops-desktop.png', {
      maxDiffPixelRatio: 0.03,
      animations: 'disabled'
    });
  });
});
