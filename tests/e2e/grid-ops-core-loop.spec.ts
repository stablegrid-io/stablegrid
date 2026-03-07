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

const seedEnergyBudget = async (page: Page) => {
  const response = await page.request.post('/api/auth/sync-progress', {
    data: {
      xp: 60000,
      streak: 0,
      completedQuestions: [],
      topicProgress: {},
      deployedNodeIds: ['control-center'],
      lastDeployedNodeId: null
    }
  });

  expect(response.ok()).toBeTruthy();
};

test.describe('grid ops core loop', () => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run this spec.'
  );

  test('deploy action updates board and persists after refresh/re-login', async ({ page }) => {
    await login(page);
    await seedEnergyBudget(page);

    await page.goto('/energy', { waitUntil: 'networkidle' });
    await expect(page.locator('main')).toContainText('Live Grid Stabilization Map', {
      timeout: 20_000
    });
    await expect(page.locator('main')).toContainText('Active Event', {
      timeout: 20_000
    });
    await expect(page.locator('main')).toContainText('Mission', {
      timeout: 20_000
    });

    const sceneEnabled = (await page.locator('[data-grid-scene=\"2p5d\"]').count()) > 0;
    if (sceneEnabled) {
      await expect
        .poll(async () => page.locator('[data-grid-node]').count(), { timeout: 20_000 })
        .toBeGreaterThan(0);

      const firstNode = page.locator('[data-grid-node]').first();
      await expect(firstNode).toHaveAttribute(
        'data-node-state',
        /offline|connected|stabilized|optimized/
      );
      await expect(firstNode).toHaveAttribute(
        'data-node-category',
        /monitoring|control|forecasting|flexibility|reinforcement/
      );
    }

    const deployedBefore = await page
      .getByRole('button', { name: /infrastructure active/i })
      .count();

    const deployButtons = page.getByRole('button', { name: /^Deploy asset$/i });
    const deployCount = await deployButtons.count();

    test.skip(deployCount === 0, 'No available assets to deploy for this account state.');

    await deployButtons.first().click();

    await expect(page.getByRole('button', { name: /deploying/i })).toBeVisible({
      timeout: 10_000
    });

    await expect
      .poll(async () => page.getByRole('button', { name: /infrastructure active/i }).count(), {
        timeout: 20_000
      })
      .toBeGreaterThan(deployedBefore);

    const deployedAfterDeploy = await page
      .getByRole('button', { name: /infrastructure active/i })
      .count();

    await page.reload({ waitUntil: 'networkidle' });
    await expect
      .poll(async () => page.getByRole('button', { name: /infrastructure active/i }).count(), {
        timeout: 20_000
      })
      .toBe(deployedAfterDeploy);

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.waitForURL('**/login', { timeout: 20_000 });

    await login(page);
    await page.goto('/energy', { waitUntil: 'networkidle' });

    await expect
      .poll(async () => page.getByRole('button', { name: /infrastructure active/i }).count(), {
        timeout: 20_000
      })
      .toBe(deployedAfterDeploy);

    await expect(page.locator('main')).toContainText('Recommended', { timeout: 20_000 });
  });
});
