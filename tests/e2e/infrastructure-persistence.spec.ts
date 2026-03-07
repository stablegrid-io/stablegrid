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

const seedDeploymentBudget = async (page: Page) => {
  const response = await page.request.post('/api/auth/sync-progress', {
    data: {
      xp: 12000,
      streak: 0,
      completedQuestions: [],
      topicProgress: {},
      deployedNodeIds: ['control-center'],
      lastDeployedNodeId: null
    }
  });

  expect(response.ok()).toBeTruthy();
};

test.describe('infrastructure persistence', () => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run this spec.'
  );

  test('persists deployment across refresh and re-login', async ({ page }) => {
    await login(page);
    await seedDeploymentBudget(page);

    await page.goto('/energy', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.removeItem('stablegrid-progress');
    });
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.locator('main')).toContainText('Live Grid Stabilization Map', {
      timeout: 20_000
    });

    const deployedBefore = await page
      .getByRole('button', { name: /infrastructure active/i })
      .count();

    const deployButtons = page.getByRole('button', { name: /^Deploy asset$/i });
    const deployCount = await deployButtons.count();

    test.skip(deployCount === 0, 'No deployable assets are currently available.');

    await deployButtons.first().click();

    await expect
      .poll(async () => page.getByRole('button', { name: /infrastructure active/i }).count(), {
        timeout: 20_000
      })
      .toBeGreaterThan(deployedBefore);

    const deployedAfter = await page
      .getByRole('button', { name: /infrastructure active/i })
      .count();

    await page.reload({ waitUntil: 'networkidle' });
    await expect
      .poll(async () => page.getByRole('button', { name: /infrastructure active/i }).count(), {
        timeout: 20_000
      })
      .toBe(deployedAfter);

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.waitForURL('**/login', { timeout: 20_000 });

    await login(page);

    await page.goto('/energy', { waitUntil: 'networkidle' });
    await expect
      .poll(async () => page.getByRole('button', { name: /infrastructure active/i }).count(), {
        timeout: 20_000
      })
      .toBe(deployedAfter);
  });
});
