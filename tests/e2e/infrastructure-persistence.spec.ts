import { expect, test, type Page } from '@playwright/test';

const E2E_EMAIL = process.env.STABLEGRID_E2E_EMAIL ?? '';
const E2E_PASSWORD = process.env.STABLEGRID_E2E_PASSWORD ?? '';

const SEED_UNITS = 5000; // 5.0 kWh for deterministic deployment testing.

const login = async (page: Page) => {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.locator('#login-password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 20_000
  });
};

const seedDeploymentState = async (page: Page) => {
  const response = await page.request.post('/api/auth/sync-progress', {
    data: {
      xp: SEED_UNITS,
      streak: 0,
      completedQuestions: [],
      topicProgress: {},
      deployedNodeIds: ['control-center'],
      lastDeployedNodeId: null
    }
  });

  expect(response.ok()).toBeTruthy();
};

const assertGridShowsDeployedCount = async (page: Page, count: string) => {
  await expect(page.locator('main').first()).toContainText(count, { timeout: 20_000 });
};

test.describe('infrastructure persistence', () => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run this spec.'
  );

  test('persists deployment across refresh and re-login', async ({ page }) => {
    await login(page);

    await seedDeploymentState(page);

    // Force a fresh client store hydration from server state.
    await page.evaluate(() => {
      localStorage.removeItem('stablegrid-progress');
    });

    await page.goto('/energy', { waitUntil: 'networkidle' });
    await expect(page.locator('main')).toContainText('Spent 0 kWh', { timeout: 20_000 });

    await page.getByRole('button', { name: /Smart Transformer/i }).click();

    const deployButton = page.getByRole('button', {
      name: /^Deploy infrastructure$/i
    });

    await expect(deployButton).toBeEnabled({ timeout: 20_000 });
    await deployButton.click();
    await expect(page.locator('main')).toContainText('Spent 2 kWh', { timeout: 20_000 });

    await assertGridShowsDeployedCount(page, '2/9');

    await page.reload({ waitUntil: 'networkidle' });
    await assertGridShowsDeployedCount(page, '2/9');

    // Logout from a page without the floating mascot overlay.
    await page.goto('/flashcards', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: new RegExp(E2E_EMAIL, 'i') }).click();
    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForURL('**/login', { timeout: 20_000 });

    await login(page);

    await page.goto('/energy', { waitUntil: 'networkidle' });
    await assertGridShowsDeployedCount(page, '2/9');
  });
});
