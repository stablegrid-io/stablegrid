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

const advanceToModuleBoundary = async (page: Page) => {
  for (let step = 0; step < 40; step += 1) {
    const nextModuleButton = page.getByRole('button', { name: /next module/i });
    if ((await nextModuleButton.count()) > 0 && (await nextModuleButton.first().isVisible())) {
      return;
    }

    await page.getByRole('button', { name: /next lesson/i }).click();
  }

  throw new Error('Timed out before reaching the next-module boundary.');
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
    await expect(page.getByLabel(/Module 2: .* locked/i)).toBeVisible({
      timeout: 20_000
    });

    await page.goto(
      '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-01',
      { waitUntil: 'networkidle' }
    );

    await advanceToModuleBoundary(page);

    await expect
      .poll(async () => {
        const response = await page.request.get('/api/learn/module-progress?topic=pyspark');
        if (!response.ok()) {
          return false;
        }

        const payload = (await response.json()) as {
          data?: Array<{ module_id: string; is_completed: boolean }>;
        };

        return payload.data?.some(
          (moduleProgress) =>
            moduleProgress.module_id === 'module-01' && moduleProgress.is_completed
        );
      }, {
      timeout: 20_000
    })
      .toBe(true);

    await page.getByRole('link', { name: /All Modules/i }).click();
    await page.waitForURL('**/learn/pyspark/theory', { timeout: 20_000 });

    await expect(page.getByLabel(/Module 2: .* locked/i)).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: /Module 2:/i }).first()
    ).toBeVisible();
  });
});
