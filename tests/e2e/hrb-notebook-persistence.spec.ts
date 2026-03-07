import { expect, test, type Page } from '@playwright/test';

const E2E_EMAIL = process.env.STABLEGRID_E2E_EMAIL ?? '';
const E2E_PASSWORD = process.env.STABLEGRID_E2E_PASSWORD ?? '';

interface NotebookProgressData {
  completedNotebookIds: string[];
  completedNotebooksCount: number;
  notebooksTotal: number;
  updatedAt: string | null;
}

interface NotebookSummary {
  completed: number;
  total: number;
}

const login = async (page: Page) => {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.locator('#login-password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 20_000
  });
};

const logout = async (page: Page) => {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /sign out/i }).click();
  await page.waitForURL('**/login', { timeout: 20_000 });
};

const seedNotebookBaseline = async (page: Page) => {
  const nowIso = new Date().toISOString();
  const response = await page.request.post('/api/auth/sync-progress', {
    data: {
      xp: 15_000,
      streak: 0,
      completedQuestions: [],
      topicProgress: {
        pyspark: {
          correct: 0,
          total: 0,
          lastAttempted: null
        },
        fabric: {
          correct: 0,
          total: 0,
          lastAttempted: null
        },
        notebooks: {
          completed_notebook_ids: [],
          completed_notebooks_count: 0,
          updated_at: nowIso
        }
      }
    }
  });

  expect(response.ok()).toBeTruthy();
};

const parseNotebookSummary = async (page: Page): Promise<NotebookSummary> => {
  const summaryLocator = page
    .locator('text=/\\d+\\/\\d+ notebook reviews submitted/i')
    .first();

  await expect(summaryLocator).toBeVisible({ timeout: 20_000 });
  const summaryText = ((await summaryLocator.textContent()) ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  const match = summaryText.match(/(\d+)\/(\d+) notebook reviews submitted/i);

  if (!match) {
    throw new Error(`Unable to parse notebook summary: ${summaryText}`);
  }

  return {
    completed: Number(match[1]),
    total: Number(match[2])
  };
};

const fetchNotebookProgress = async (page: Page): Promise<NotebookProgressData> => {
  const response = await page.request.get('/api/practice/notebooks/progress');
  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as {
    data?: NotebookProgressData;
  };
  const data = payload?.data;

  if (!data) {
    throw new Error('Notebook progress payload is missing `data`.');
  }

  return data;
};

const submitSingleNotebookReview = async (page: Page) => {
  await page.goto('/practice/notebooks', { waitUntil: 'networkidle' });
  await expect(page.locator('main')).toContainText('Notebook Gallery', {
    timeout: 20_000
  });

  const openReviewButton = page.getByRole('button', { name: /open review/i }).first();
  await expect(openReviewButton).toBeVisible({ timeout: 20_000 });
  await openReviewButton.click();

  const submitButton = page.getByRole('button', { name: /submit review/i });
  await expect(submitButton).toBeVisible({ timeout: 20_000 });

  const flaggableLine = page.locator('div[role="button"][tabindex="0"]').first();
  await expect(flaggableLine).toBeVisible({ timeout: 20_000 });
  await flaggableLine.click();

  await submitButton.click();
  await expect(page.getByText('Review Score')).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: /back to notebooks/i }).click();
  await expect(
    page.locator('text=/\\d+\\/\\d+ notebook reviews submitted/i').first()
  ).toBeVisible({
    timeout: 20_000
  });
};

const syncProgressWithoutNotebookPayload = async (page: Page) => {
  const getResponse = await page.request.get('/api/auth/sync-progress');
  expect(getResponse.ok()).toBeTruthy();

  const payload = (await getResponse.json()) as {
    data?: {
      xp?: unknown;
      streak?: unknown;
      completed_questions?: unknown;
      topic_progress?: unknown;
    };
  };
  const data = payload?.data ?? {};
  const topicProgress =
    typeof data.topic_progress === 'object' &&
    data.topic_progress !== null &&
    !Array.isArray(data.topic_progress)
      ? { ...(data.topic_progress as Record<string, unknown>) }
      : {};

  delete topicProgress.notebooks;

  const postResponse = await page.request.post('/api/auth/sync-progress', {
    data: {
      xp: Number(data.xp ?? 0),
      streak: Number(data.streak ?? 0),
      completedQuestions: Array.isArray(data.completed_questions)
        ? data.completed_questions
        : [],
      topicProgress
    }
  });

  expect(postResponse.ok()).toBeTruthy();
};

const expectHrbNotebookCriterion = async (page: Page, completedCount: number) => {
  await page.goto('/progress', { waitUntil: 'networkidle' });
  await expect(
    page.getByRole('heading', {
      name: 'Career Ladder'
    })
  ).toBeVisible({ timeout: 20_000 });

  const showCompletedButton = page.getByRole('button', {
    name: /show completed/i
  });
  if ((await showCompletedButton.count()) > 0) {
    await showCompletedButton.first().click();
  }

  const notebookCriterion = page
    .locator('ul[aria-label="Promotion criteria"] li')
    .filter({ hasText: 'Notebook reviews' })
    .first();

  await expect(notebookCriterion).toBeVisible({ timeout: 20_000 });
  await expect(notebookCriterion).toContainText(
    new RegExp(`${completedCount}\\/\\d+ notebooks`, 'i')
  );
};

test.describe('HRB notebook persistence', () => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run this spec.'
  );

  test('persists notebook completion across refresh/re-login and survives sync-progress writes', async ({
    page
  }) => {
    await login(page);
    await seedNotebookBaseline(page);

    await page.goto('/practice/notebooks', { waitUntil: 'networkidle' });

    const beforeSummary = await parseNotebookSummary(page);
    expect(beforeSummary.completed).toBe(0);

    const beforeProgress = await fetchNotebookProgress(page);
    expect(beforeProgress.completedNotebooksCount).toBe(0);

    await submitSingleNotebookReview(page);

    const afterSubmitSummary = await parseNotebookSummary(page);
    expect(afterSubmitSummary.completed).toBe(beforeSummary.completed + 1);

    const afterSubmitProgress = await fetchNotebookProgress(page);
    expect(afterSubmitProgress.completedNotebooksCount).toBe(afterSubmitSummary.completed);
    expect(afterSubmitProgress.completedNotebookIds.length).toBe(
      afterSubmitSummary.completed
    );

    await page.reload({ waitUntil: 'networkidle' });
    const afterReloadSummary = await parseNotebookSummary(page);
    expect(afterReloadSummary.completed).toBe(afterSubmitSummary.completed);

    await syncProgressWithoutNotebookPayload(page);
    const afterSyncProgress = await fetchNotebookProgress(page);
    expect(afterSyncProgress.completedNotebooksCount).toBe(
      afterSubmitProgress.completedNotebooksCount
    );

    await logout(page);
    await login(page);

    await page.goto('/practice/notebooks', { waitUntil: 'networkidle' });
    const afterReloginSummary = await parseNotebookSummary(page);
    expect(afterReloginSummary.completed).toBe(afterSubmitSummary.completed);

    await expectHrbNotebookCriterion(page, afterReloginSummary.completed);
  });
});
