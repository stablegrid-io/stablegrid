import { expect, test, type Page } from '@playwright/test';

const E2E_EMAIL = process.env.STABLEGRID_E2E_EMAIL ?? '';
const E2E_PASSWORD = process.env.STABLEGRID_E2E_PASSWORD ?? '';
const THEORY_ROUTE =
  '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-01';

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

const prepareTheoryModule = async (page: Page) => {
  await syncModuleProgress(page, { topic: 'pyspark', action: 'ensure' });
  await syncModuleProgress(page, {
    topic: 'pyspark',
    action: 'incomplete',
    moduleId: 'module-01'
  });
};

const advanceToModuleBoundary = async (page: Page) => {
  for (let step = 0; step < 40; step += 1) {
    const nextModuleButton = page.getByRole('button', { name: /next module/i });
    if ((await nextModuleButton.count()) > 0 && (await nextModuleButton.first().isVisible())) {
      return;
    }

    const startCheckpointButton = page.getByRole('button', { name: /start checkpoint/i });
    if (
      (await startCheckpointButton.count()) > 0 &&
      (await startCheckpointButton.first().isVisible())
    ) {
      return;
    }

    await page.getByRole('button', { name: /next lesson/i }).click();
  }

  throw new Error('Timed out before reaching the next-module boundary.');
};

const completeCheckpoint = async (page: Page) => {
  await page.getByRole('button', { name: /start checkpoint/i }).click();

  for (let index = 0; index < 3; index += 1) {
    await page.getByTestId('multiple-choice-option-0').click();
    await page.getByRole('button', { name: /submit answer/i }).click();
    await page.getByRole('button', {
      name: index === 2 ? /complete module/i : /next flashcard/i
    }).click();
  }
};

test.describe('theory session picker', () => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run this spec.'
  );

  test('supports the popup flow from dismiss to session summary', async ({ page }) => {
    await login(page);
    await prepareTheoryModule(page);

    await page.goto(THEORY_ROUTE, { waitUntil: 'networkidle' });

    const dialog = page.getByRole('dialog', { name: /session picker/i });
    await expect(dialog).toBeVisible({ timeout: 20_000 });

    await dialog.getByRole('button', { name: /pomodoro/i }).click();
    await expect(dialog.getByRole('button', { name: /pomodoro/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await dialog.getByRole('button', { name: /increase focus/i }).click();
    await expect(dialog.getByText('2h 15m total').first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /session picker/i })).toHaveCount(0);

    await page.getByRole('button', { name: /^session$/i }).click();

    const reopenedDialog = page.getByRole('dialog', { name: /session picker/i });
    await expect(reopenedDialog).toBeVisible();
    await expect(
      reopenedDialog.getByRole('button', { name: /pomodoro/i })
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(reopenedDialog.getByText('2h 15m total').first()).toBeVisible();

    await reopenedDialog.getByRole('button', { name: /start session/i }).click();
    await expect(page.getByRole('dialog', { name: /session picker/i })).toHaveCount(0);

    await expect(page.getByRole('button', { name: /pause session/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /stop session/i })).toBeVisible();
    await expect(page.getByText('Pomodoro').first()).toBeVisible();

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
    await expect(resetDialog.getByRole('button', { name: /pomodoro/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expect(resetDialog.getByText('2h 15m total').first()).toBeVisible();
  });

  test('keeps an active session visible after a full page reload', async ({ page }) => {
    await login(page);
    await prepareTheoryModule(page);

    await page.goto(THEORY_ROUTE, { waitUntil: 'networkidle' });

    const dialog = page.getByRole('dialog', { name: /session picker/i });
    await expect(dialog).toBeVisible({ timeout: 20_000 });

    await dialog.getByRole('button', { name: /start session/i }).click();
    await expect(page.getByRole('dialog', { name: /session picker/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /pause session/i })).toBeVisible();
    await expect(page.getByText('Pomodoro').first()).toBeVisible();

    await page.waitForTimeout(1_500);
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.getByRole('button', { name: /pause session/i })).toBeVisible({
      timeout: 20_000
    });
    await expect(page.getByRole('button', { name: /stop session/i })).toBeVisible();
    await expect(page.getByRole('dialog', { name: /session picker/i })).toHaveCount(0);
    await expect(page.getByText('Pomodoro').first()).toBeVisible();
  });

  test('keeps the session draft without reopening when you move to the next module', async ({ page }) => {
    await login(page);
    await prepareTheoryModule(page);

    await page.goto(THEORY_ROUTE, { waitUntil: 'networkidle' });

    const dialog = page.getByRole('dialog', { name: /session picker/i });
    await expect(dialog).toBeVisible({ timeout: 20_000 });

    await dialog.getByRole('button', { name: /pomodoro/i }).click();
    await dialog.getByRole('button', { name: /increase focus/i }).click();
    await page.getByRole('button', { name: /continue without session/i }).click();
    await expect(page.getByRole('dialog', { name: /session picker/i })).toHaveCount(0);

    await advanceToModuleBoundary(page);
    await completeCheckpoint(page);

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

    await page.getByRole('button', { name: /next module/i }).click();
    await page.waitForURL(/chapter=module-02/, { timeout: 20_000 });

    await expect(
      page.getByRole('dialog', { name: /session picker/i })
    ).toHaveCount(0);

    await page.getByRole('button', { name: /^session$/i }).click();

    const reopenedDialog = page.getByRole('dialog', { name: /session picker/i });
    await expect(reopenedDialog).toBeVisible({ timeout: 20_000 });
    await expect(
      reopenedDialog.getByRole('button', { name: /pomodoro/i })
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(reopenedDialog.getByText('2h 15m total').first()).toBeVisible();
  });
});
