import { expect, test, type Page } from '@playwright/test';

const THEORY_ROUTE =
  '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-01';
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

const prepareTheoryModule = async (page: Page) => {
  await syncModuleProgress(page, { topic: 'pyspark', action: 'ensure' });
  await syncModuleProgress(page, {
    topic: 'pyspark',
    action: 'incomplete',
    moduleId: 'module-01'
  });
};

test.describe('theory session picker', () => {
  test.skip(
    !HAS_E2E_CREDENTIALS,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run without creating test users.'
  );

  test('supports the popup flow from dismiss to session summary', async ({ page }) => {
    const credentials: E2ECredentials = {
      email: E2E_EMAIL,
      password: E2E_PASSWORD
    };
    await login(page, credentials);
    await prepareTheoryModule(page);

    await page.goto(THEORY_ROUTE, { waitUntil: 'networkidle' });

    const dialog = page.getByRole('dialog', { name: /session picker/i });
    await expect(dialog).toBeVisible({ timeout: 20_000 });

    await dialog.getByRole('button', { name: /pomodoro/i }).click();
    await expect(dialog.getByRole('button', { name: /pomodoro/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /session picker/i })).toHaveCount(0);

    await page.getByRole('button', { name: /^session$/i }).click();

    const reopenedDialog = page.getByRole('dialog', { name: /session picker/i });
    await expect(reopenedDialog).toBeVisible();
    await reopenedDialog.getByRole('button', { name: /pomodoro/i }).click();

    await reopenedDialog.getByRole('button', { name: /start session/i }).click();
    await expect(page.getByRole('dialog', { name: /session picker/i })).toHaveCount(0);

    await expect(page.getByRole('button', { name: /pause session/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /stop session/i })).toBeVisible();

    await page.waitForTimeout(1_500);
    await page.getByRole('button', { name: /pause session/i }).click();
    await expect(page.getByRole('button', { name: /resume session/i })).toBeVisible();
    await page.getByRole('button', { name: /resume session/i }).click();

    await page.waitForTimeout(1_000);
    await page.getByRole('button', { name: /stop session/i }).click();

    await expect(page.getByText(/session complete/i)).toBeVisible();
    await expect(page.getByText(/total time/i)).toBeVisible();
    await expect(page.getByText(/focus time/i)).toBeVisible();
    await expect(page.getByText(/break time/i)).toBeVisible();

    await page.getByRole('button', { name: /new session/i }).click();

    const resetDialog = page.getByRole('dialog', { name: /session picker/i });
    await expect(resetDialog).toBeVisible();
  });

  test('keeps an active session visible after a full page reload', async ({ page }) => {
    const credentials: E2ECredentials = {
      email: E2E_EMAIL,
      password: E2E_PASSWORD
    };
    await login(page, credentials);
    await prepareTheoryModule(page);

    await page.goto(THEORY_ROUTE, { waitUntil: 'networkidle' });

    const dialog = page.getByRole('dialog', { name: /session picker/i });
    await expect(dialog).toBeVisible({ timeout: 20_000 });

    await dialog.getByRole('button', { name: /start session/i }).click();
    await expect(page.getByRole('dialog', { name: /session picker/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /pause session/i })).toBeVisible();

    await page.waitForTimeout(1_500);
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.getByRole('button', { name: /pause session/i })).toBeVisible({
      timeout: 20_000
    });
    await expect(page.getByRole('button', { name: /stop session/i })).toBeVisible();
    await expect(page.getByRole('dialog', { name: /session picker/i })).toHaveCount(0);
  });

  test('keeps the session draft without reopening when you move to the next module', async ({ page }) => {
    const credentials: E2ECredentials = {
      email: E2E_EMAIL,
      password: E2E_PASSWORD
    };
    await login(page, credentials);
    await prepareTheoryModule(page);

    await page.goto(THEORY_ROUTE, { waitUntil: 'networkidle' });

    const dialog = page.getByRole('dialog', { name: /session picker/i });
    await expect(dialog).toBeVisible({ timeout: 20_000 });

    await dialog.getByRole('button', { name: /pomodoro/i }).click();
    await page.getByRole('button', { name: /continue without session/i }).click();
    await expect(page.getByRole('dialog', { name: /session picker/i })).toHaveCount(0);
    await page.goto(
      '/learn/pyspark/theory/all?chapter=module-02&lesson=module-02-lesson-01',
      {
        waitUntil: 'networkidle'
      }
    );

    await expect(
      page.getByRole('dialog', { name: /session picker/i })
    ).toHaveCount(0);

    await page.getByRole('button', { name: /^session$/i }).click();

    const reopenedDialog = page.getByRole('dialog', { name: /session picker/i });
    await expect(reopenedDialog).toBeVisible({ timeout: 20_000 });
  });
});
