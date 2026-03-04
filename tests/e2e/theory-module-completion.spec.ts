import { expect, test, type Page } from '@playwright/test';

const E2E_EMAIL = process.env.STABLEGRID_E2E_EMAIL ?? '';
const E2E_PASSWORD = process.env.STABLEGRID_E2E_PASSWORD ?? '';
const HAS_E2E_CREDENTIALS = Boolean(E2E_EMAIL && E2E_PASSWORD);

interface E2ECredentials {
  email: string;
  password: string;
}

const login = async (page: Page, credentials: E2ECredentials) => {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(credentials.email);
  await page.locator('#login-password').fill(credentials.password);
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

const dismissSessionPickerIfOpen = async (page: Page) => {
  const skipButton = page.getByRole('button', { name: /continue without session/i });
  if ((await skipButton.count()) > 0 && (await skipButton.first().isVisible())) {
    await skipButton.first().click();
  }
};

test.describe('theory module completion', () => {
  test.skip(
    !HAS_E2E_CREDENTIALS,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run without creating test users.'
  );

  test('completes module progress flow and returns to topic view', async ({ page }) => {
    const credentials: E2ECredentials = {
      email: E2E_EMAIL,
      password: E2E_PASSWORD
    };
    await login(page, credentials);

    await syncModuleProgress(page, { topic: 'pyspark', action: 'ensure' });
    await syncModuleProgress(page, {
      topic: 'pyspark',
      action: 'incomplete',
      moduleId: 'module-01'
    });

    await expect
      .poll(async () => {
        const response = await page.request.get('/api/learn/module-progress?topic=pyspark');
        if (!response.ok()) {
          return null;
        }

        const payload = (await response.json()) as {
          data?: Array<{ module_id: string; is_completed: boolean }>;
        };

        return (
          payload.data?.find((moduleProgress) => moduleProgress.module_id === 'module-01')
            ?.is_completed ?? null
        );
      })
      .toBe(false);

    await page.goto(
      '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-01',
      { waitUntil: 'networkidle' }
    );

    await dismissSessionPickerIfOpen(page);
    await expect(page.getByRole('button', { name: /next lesson/i })).toBeVisible();
    await page.getByRole('button', { name: /next lesson/i }).click();

    await syncModuleProgress(page, {
      topic: 'pyspark',
      action: 'complete',
      moduleId: 'module-01'
    });

    await page.getByRole('link', { name: /All Modules/i }).click();
    await page.waitForURL('**/learn/pyspark/theory', { timeout: 20_000 });
    await expect(page.getByText(/PySpark Modules/i).first()).toBeVisible();
  });
});
