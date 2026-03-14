import { expect, test, type Page } from '@playwright/test';

const E2E_EMAIL = process.env.STABLEGRID_E2E_EMAIL ?? '';
const E2E_PASSWORD = process.env.STABLEGRID_E2E_PASSWORD ?? '';

const login = async (page: Page) => {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.locator('#login-password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 20_000
  });
};

test.describe('/admin access', () => {
  test('redirects unauthenticated visitors to login', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForURL((url) => url.pathname.startsWith('/login'), {
      timeout: 20_000
    });
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('blocks authenticated non-admin users with a 403 response', async ({ page }) => {
    test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'Set e2e credentials to run admin access checks.');

    await login(page);

    const response = await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(403);
    await expect(page.locator('body')).toContainText('Forbidden');
  });
});
