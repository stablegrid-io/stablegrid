import { expect, test, type Page } from '@playwright/test';

const E2E_EMAIL = process.env.STABLEGRID_E2E_EMAIL ?? '';
const E2E_PASSWORD = process.env.STABLEGRID_E2E_PASSWORD ?? '';
const HAS_E2E_CREDENTIALS = Boolean(E2E_EMAIL && E2E_PASSWORD);
const DESKTOP_SCREENSHOT_PATH = 'test-results/home-operator-console-desktop.png';
const MOBILE_SCREENSHOT_PATH = 'test-results/home-operator-console-mobile.png';

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

const getCredentials = (): E2ECredentials => ({
  email: E2E_EMAIL,
  password: E2E_PASSWORD
});

const buildLocalProgressSnapshot = () => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const timestamp = now.getTime();

  return {
    state: {
      xp: 138000,
      streak: 6,
      completedQuestions: ['py-q-01', 'py-q-02', 'py-q-03', 'fabric-q-01'],
      deployedNodeIds: ['control-center', 'smart-transformer'],
      lastDeployedNodeId: 'smart-transformer',
      revision: 1,
      topicProgress: {
        pyspark: {
          correct: 9,
          total: 12,
          lastAttempted: now.toISOString()
        },
        fabric: {
          correct: 4,
          total: 6,
          lastAttempted: now.toISOString()
        }
      },
      dailyXP: {
        [today]: 180
      },
      dailyQuestions: {
        [today]: 4
      },
      questionHistory: [
        {
          questionId: 'py-q-10',
          topic: 'pyspark',
          correct: false,
          timestamp: timestamp - 7 * 60 * 1000,
          xp: 0
        },
        {
          questionId: 'py-q-11',
          topic: 'pyspark',
          correct: false,
          timestamp: timestamp - 6 * 60 * 1000,
          xp: 0
        },
        {
          questionId: 'py-q-12',
          topic: 'pyspark',
          correct: false,
          timestamp: timestamp - 5 * 60 * 1000,
          xp: 0
        },
        {
          questionId: 'fabric-q-02',
          topic: 'fabric',
          correct: true,
          timestamp: timestamp - 4 * 60 * 1000,
          xp: 20
        }
      ],
      energyEvents: [
        {
          id: 'evt-home-1',
          source: 'flashcard-correct',
          units: 20,
          timestamp: timestamp - 4 * 60 * 1000,
          topic: 'fabric',
          label: 'Flashcard correct'
        }
      ]
    },
    version: 0
  };
};

const hydrateLocalProgress = async (page: Page) => {
  const snapshot = buildLocalProgressSnapshot();
  await page.evaluate((payload) => {
    window.localStorage.setItem('stablegrid-progress', JSON.stringify(payload));
  }, snapshot);
};

test.describe('home operator console', () => {
  test.skip(
    !HAS_E2E_CREDENTIALS,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run without creating test users.'
  );

  test('keeps the next action reachable from the console in under 10 seconds', async ({
    page
  }) => {
    const credentials = getCredentials();
    await login(page, credentials);
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('home-primary-action')).toBeVisible({
      timeout: 10_000
    });
    await expect(page.locator('[data-testid^="system-status-metric-"]')).toHaveCount(4);
    await expect(page.getByTestId('home-learning-grid')).toBeVisible({ timeout: 10_000 });

    const recommendedNode = page
      .locator('[data-testid^="learning-grid-node-"][data-recommended="true"]:visible')
      .first();
    await expect(recommendedNode).toBeVisible({ timeout: 10_000 });
    await recommendedNode.click();

    const drawer = page.locator('[data-testid="learning-grid-drawer"]:visible');
    await expect(drawer).toBeVisible({ timeout: 10_000 });
    await expect
      .poll(
        async () => drawer.locator('[data-testid^="learning-grid-action-"]').count(),
        {
          timeout: 10_000
        }
      )
      .toBeGreaterThan(0);
    const drawerBounds = await drawer.boundingBox();
    const recommendedNodeBounds = await recommendedNode.boundingBox();
    expect(drawerBounds).not.toBeNull();
    expect(recommendedNodeBounds).not.toBeNull();
    expect((drawerBounds?.x ?? 0) >= 0).toBeTruthy();
    expect((drawerBounds?.y ?? 0) >= 0).toBeTruthy();
    expect((drawerBounds?.x ?? 0) + (drawerBounds?.width ?? 0) <= 1440).toBeTruthy();
    expect((drawerBounds?.y ?? 0) + (drawerBounds?.height ?? 0) <= 1180).toBeTruthy();
    const gapToRight =
      (drawerBounds?.x ?? 0) -
      ((recommendedNodeBounds?.x ?? 0) + (recommendedNodeBounds?.width ?? 0));
    const gapToLeft =
      (recommendedNodeBounds?.x ?? 0) -
      ((drawerBounds?.x ?? 0) + (drawerBounds?.width ?? 0));
    expect(Math.min(Math.abs(gapToRight), Math.abs(gapToLeft)) <= 120).toBeTruthy();
    const drawerScrollMetrics = await drawer.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight
    }));
    expect(
      drawerScrollMetrics.scrollHeight <= drawerScrollMetrics.clientHeight + 2
    ).toBeTruthy();

    await page.keyboard.press('Escape');
    await expect(
      page.locator('[data-testid="learning-grid-drawer"]:visible')
    ).toHaveCount(0);

    await recommendedNode.click();
    await expect(drawer).toBeVisible({ timeout: 10_000 });
    await page.mouse.click(20, 20);
    await expect(
      page.locator('[data-testid="learning-grid-drawer"]:visible')
    ).toHaveCount(0);

    const primaryHref = await page
      .getByTestId('home-primary-action')
      .getAttribute('href');
    expect(primaryHref).toBeTruthy();

    await page.getByTestId('home-primary-action').click();
    await page.waitForURL(
      (url) =>
        Boolean(primaryHref) &&
        url.pathname !== '/' &&
        url.pathname.startsWith(primaryHref!),
      { timeout: 20_000 }
    );
  });

  test('captures desktop and mobile operator console references', async ({ page }) => {
    const credentials = getCredentials();
    await login(page, credentials);
    await page.waitForLoadState('networkidle');
    await hydrateLocalProgress(page);

    await page.setViewportSize({ width: 1440, height: 1180 });
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('home-learning-grid')).toBeVisible({
      timeout: 10_000
    });
    await page.screenshot({
      path: DESKTOP_SCREENSHOT_PATH,
      fullPage: true,
      animations: 'disabled'
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('home-learning-grid')).toBeVisible({
      timeout: 10_000
    });
    await page.screenshot({
      path: MOBILE_SCREENSHOT_PATH,
      fullPage: true,
      animations: 'disabled'
    });
  });
});
