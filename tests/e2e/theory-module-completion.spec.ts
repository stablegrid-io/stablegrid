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

const syncModuleProgress = async (
  page: Page,
  payload: {
    topic: 'pyspark' | 'fabric';
    action: 'ensure' | 'complete' | 'incomplete' | 'touch';
    moduleId?: string;
    currentLessonId?: string | null;
    lastVisitedRoute?: string | null;
  }
) => {
  const response = await page.request.post('/api/learn/module-progress', {
    data: payload
  });
  expect(response.ok()).toBeTruthy();
};

test.describe('theory module completion', () => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run this spec.'
  );

  test('completing module 1 unlocks module 2', async ({ page }) => {
    await login(page);

    await syncModuleProgress(page, { topic: 'pyspark', action: 'ensure' });
    await syncModuleProgress(page, {
      topic: 'pyspark',
      action: 'incomplete',
      moduleId: 'module-01'
    });

    await page.goto('/learn/pyspark/theory', { waitUntil: 'networkidle' });
    await expect(
      page.getByLabel('Module 2: Up and Running with DataFrames locked')
    ).toBeVisible({ timeout: 20_000 });

    await page
      .getByRole('link', { name: /Module 1: The Dawn of PySpark/i })
      .first()
      .click();

    await expect(
      page.getByRole('button', { name: /I have read this module/i })
    ).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /I have read this module/i }).click();

    await expect(page.locator('body')).toContainText('Module completed', {
      timeout: 20_000
    });

    await page.getByRole('link', { name: /Back to modules/i }).click();
    await page.waitForURL('**/learn/pyspark/theory', { timeout: 20_000 });

    await expect(
      page.getByLabel('Module 2: Up and Running with DataFrames locked')
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: /Module 2: Up and Running with DataFrames/i }).first()
    ).toBeVisible();
  });
});
