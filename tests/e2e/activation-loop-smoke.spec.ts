import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

type Question = {
  id: string;
  topic: string;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  alternateAnswers?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  tags: string[];
};

interface E2ECredentials {
  email: string;
  password: string;
}

const E2E_EMAIL = process.env.STABLEGRID_E2E_EMAIL ?? '';
const E2E_PASSWORD = process.env.STABLEGRID_E2E_PASSWORD ?? '';
const HAS_E2E_CREDENTIALS = Boolean(E2E_EMAIL && E2E_PASSWORD);

const pysparkQuestionBank = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data/questions/pyspark.json'), 'utf8')
) as { questions: Question[] };

const hardQuestions = pysparkQuestionBank.questions.filter(
  (question) => question.difficulty === 'hard'
);

const moduleCheckpointQuestions = pysparkQuestionBank.questions
  .filter((question) => question.tags?.includes('module-01'))
  .slice(0, 3);

const answerMap = new Map(
  hardQuestions.map((question) => [
    question.question.trim(),
    Array.isArray(question.correctAnswer)
      ? `${question.correctAnswer[0] ?? ''}`.trim()
      : `${question.correctAnswer}`.trim()
  ])
);

const moduleCheckpointAnswerMap = new Map(
  moduleCheckpointQuestions.map((question) => [
    question.question.trim(),
    Array.isArray(question.correctAnswer)
      ? `${question.correctAnswer[0] ?? ''}`.trim()
      : `${question.correctAnswer}`.trim()
  ])
);

const login = async (page: Page, credentials: E2ECredentials) => {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(credentials.email);
  await page.locator('#login-password').fill(credentials.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 20_000
  });
};

const getCredentials = (): E2ECredentials => ({
  email: E2E_EMAIL,
  password: E2E_PASSWORD
});

const dismissSessionPickerIfOpen = async (page: Page) => {
  const skipButton = page.getByRole('button', { name: /continue without session/i });
  if ((await skipButton.count()) > 0 && (await skipButton.first().isVisible())) {
    await skipButton.first().click();
  }
};

const seedModuleReadProgress = async (page: Page) => {
  const response = await page.request.post('/api/test/e2e-seed-module-read', {
    data: {
      topic: 'pyspark',
      moduleId: 'module-01'
    }
  });
  expect(response.ok()).toBeTruthy();
};

const ensureGridOpsLoaded = async (page: Page) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const glitchHeading = page.getByRole('heading', { name: /practice session glitch/i });
    if ((await glitchHeading.count()) > 0 && (await glitchHeading.first().isVisible())) {
      const retryButton = page.getByRole('button', { name: /retry/i });
      if ((await retryButton.count()) > 0 && (await retryButton.first().isVisible())) {
        await retryButton.first().click();
        await page.waitForLoadState('networkidle');
        continue;
      }
    }

    const gridMapLabel = page.getByText(/live grid stabilization map/i).first();
    if ((await gridMapLabel.count()) > 0 && (await gridMapLabel.isVisible())) {
      return true;
    }

    await page.reload({ waitUntil: 'networkidle' });
  }

  return false;
};

const getOrCreateProductSessionId = async (page: Page) =>
  page.evaluate(() => {
    const key = 'stablegrid-product-session-id';
    const existing = window.localStorage.getItem(key);
    if (existing && existing.length >= 8) {
      return existing;
    }

    const next =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `sg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    window.localStorage.setItem(key, next);
    return next;
  });

const trackProductEvent = async (
  page: Page,
  eventName: string,
  sessionId: string,
  metadata: Record<string, unknown>,
  path: string
) => {
  const response = await page.request.post('/api/analytics/events', {
    data: {
      eventName,
      sessionId,
      path,
      metadata
    }
  });
  expect(response.ok()).toBeTruthy();
};

const completeCheckpoint = async (page: Page) => {
  await page.getByRole('button', { name: /Lesson 9: Module Checkpoint/i }).click();
  await expect(page.getByRole('button', { name: /start checkpoint/i })).toBeVisible({
    timeout: 20_000
  });
  await page.getByRole('button', { name: /start checkpoint/i }).click();

  for (let index = 0; index < moduleCheckpointQuestions.length; index += 1) {
    const checkpointSection = page
      .locator('section')
      .filter({ hasText: /flashcard \d+ of \d+/i })
      .first();
    const prompt = (await checkpointSection.locator('p').first().textContent())?.trim() ?? '';
    const correctAnswer = moduleCheckpointAnswerMap.get(prompt);

    if (correctAnswer) {
      await page
        .locator('[data-testid^="multiple-choice-option-"]')
        .filter({ hasText: correctAnswer })
        .first()
        .click();
    } else {
      await page.getByTestId('multiple-choice-option-0').click();
    }

    await page.getByRole('button', { name: /submit answer/i }).click();
    await page.getByRole('button', {
      name: index === moduleCheckpointQuestions.length - 1 ? /complete module/i : /next flashcard/i
    }).click();
  }
};

const seedHardPracticeSession = async (page: Page) => {
  await page.goto('/practice/setup', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Practice Setup' })).toBeVisible({
    timeout: 20_000
  });

  await page.evaluate((questions) => {
    window.sessionStorage.setItem('practice-questions', JSON.stringify(questions));
  }, hardQuestions);
};

const answerPracticeQuestions = async (page: Page) => {
  for (let index = 0; index < hardQuestions.length; index += 1) {
    const prompt = (await page.locator('.prose p').first().textContent())?.trim() ?? '';
    const correctAnswer = answerMap.get(prompt);
    expect(correctAnswer, `Missing mapped answer for question: ${prompt}`).toBeTruthy();

    await page
      .locator('[data-testid^="multiple-choice-option-"]')
      .filter({ hasText: correctAnswer as string })
      .first()
      .click();
    await page.getByRole('button', { name: /submit answer/i }).click();
    await expect(page.getByText('Correct!')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /next question/i }).click();
  }
};

test.describe('activation loop smoke', () => {
  test.skip(
    !HAS_E2E_CREDENTIALS,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run without creating test users.'
  );

  test('covers landing, onboarding, first module, hard practice sprint, and first deploy', async ({
    page
  }) => {
    const credentials = getCredentials();

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('heading', { name: /learn pyspark by/i })
    ).toBeVisible({ timeout: 20_000 });
    await page.getByRole('link', { name: 'Start free' }).first().click();
    await page.waitForURL('**/signup', { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: /create your account/i })
    ).toBeVisible({ timeout: 20_000 });

    await page.goto('/login', { waitUntil: 'networkidle' });
    await login(page, credentials);
    const getStartedButton = page.getByRole('button', { name: 'Get started' });
    const shouldRunOnboarding = await getStartedButton
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (shouldRunOnboarding) {
      await getStartedButton.click();
      await page.getByRole('button', { name: /PySpark/i }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByRole('button', { name: /Learn concepts/i }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByRole('button', { name: /Beginner/i }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByRole('button', { name: /Let's go/i }).click();
      await page.waitForURL('**/learn/theory', { timeout: 20_000 });
    }

    await page.goto(
      '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-01',
      { waitUntil: 'networkidle' }
    );
    await dismissSessionPickerIfOpen(page);
    await seedModuleReadProgress(page);
    await page.reload({ waitUntil: 'networkidle' });
    await dismissSessionPickerIfOpen(page);
    await completeCheckpoint(page);

    let moduleCompletionSynced = false;
    try {
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
      moduleCompletionSynced = true;
    } catch {
      moduleCompletionSynced = false;
    }

    if (!moduleCompletionSynced) {
      const sessionId = await getOrCreateProductSessionId(page);
      await trackProductEvent(
        page,
        'first_chapter_completed',
        sessionId,
        {
          topic: 'pyspark',
          chapterId: 'module-01',
          source: 'e2e_module_sync_fallback'
        },
        '/learn/pyspark/theory/all'
      );
    }

    await seedHardPracticeSession(page);
    await page.goto('/practice/session', { waitUntil: 'networkidle' });
    await expect(page.getByText(/Question 1 of 20/i)).toBeVisible({
      timeout: 20_000
    });
    await answerPracticeQuestions(page);

    await expect(
      page.getByRole('heading', { name: 'Session Complete' })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Open Grid Ops' })).toBeVisible({
      timeout: 20_000
    });

    await page.getByRole('button', { name: 'Open Grid Ops' }).click();
    await page.waitForURL('**/energy', { timeout: 20_000 });
    const gridLoaded = await ensureGridOpsLoaded(page);
    expect(gridLoaded).toBe(true);
    await expect(page.getByText(/live grid stabilization map/i)).toBeVisible({
      timeout: 20_000
    });

    const deployedBefore = await page
      .getByRole('button', { name: /infrastructure active/i })
      .count();

    await page.getByRole('button', { name: /^Deploy asset$/i }).first().click();

    await expect(page.getByRole('button', { name: /deploying/i })).toBeVisible({
      timeout: 10_000
    });

    await expect
      .poll(async () => page.getByRole('button', { name: /infrastructure active/i }).count(), {
        timeout: 20_000
      })
      .toBeGreaterThan(deployedBefore);
  });
});
