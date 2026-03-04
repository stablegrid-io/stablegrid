import { expect, test, type Locator, type Page } from '@playwright/test';

const THEORY_ROUTE =
  '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-01';
const MOBILE_BASELINE_SCREENSHOT_PATH = 'test-results/theory-mobile-a11y-baseline.png';
const E2E_EMAIL = process.env.STABLEGRID_E2E_EMAIL ?? '';
const E2E_PASSWORD = process.env.STABLEGRID_E2E_PASSWORD ?? '';
const HAS_E2E_CREDENTIALS = Boolean(E2E_EMAIL && E2E_PASSWORD);

interface E2ECredentials {
  email: string;
  password: string;
}

const tabToElement = async (page: Page, locator: Locator, maxTabs = 24) => {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press('Tab');
    if (await locator.evaluate((element) => element === document.activeElement)) {
      return;
    }
  }

  throw new Error('Unable to focus requested element with keyboard navigation.');
};

const dismissSessionPickerWithKeyboard = async (page: Page) => {
  const continueButton = page.getByRole('button', { name: /continue without session/i });
  if ((await continueButton.count()) === 0) {
    return;
  }
  if (!(await continueButton.first().isVisible())) {
    return;
  }

  await tabToElement(page, continueButton.first(), 28);
  await page.keyboard.press('Enter');
  await expect(continueButton).toHaveCount(0);
};

test.describe('theory mobile accessibility baseline', () => {
  test.skip(
    !HAS_E2E_CREDENTIALS,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run without creating test users.'
  );
  test.use({ viewport: { width: 390, height: 844 } });

  test('supports keyboard login and chapter navigation on mobile', async ({ page }) => {
    const credentials: E2ECredentials = {
      email: E2E_EMAIL,
      password: E2E_PASSWORD
    };

    await page.goto('/login', { waitUntil: 'networkidle' });

    const emailInput = page.getByLabel('Email');
    const passwordInput = page.locator('#login-password');
    const loginButton = page.getByRole('button', { name: 'Log in' });

    await tabToElement(page, emailInput);
    await page.keyboard.type(credentials.email);

    await tabToElement(page, passwordInput);
    await page.keyboard.type(credentials.password);

    await tabToElement(page, loginButton);
    const loginFocusRing = await loginButton.evaluate(
      (element) => getComputedStyle(element).boxShadow
    );
    expect(loginFocusRing).not.toBe('none');

    await page.keyboard.press('Enter');
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 20_000
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /open profile menu/i }).click();
    await expect(page.getByRole('link', { name: /^privacy$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^terms$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^support$/i })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.goto(THEORY_ROUTE, { waitUntil: 'networkidle' });
    await dismissSessionPickerWithKeyboard(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '18px';
    });

    const nextLessonButton = page.getByRole('button', {
      name: /(next lesson|continue)/i
    });
    await expect(nextLessonButton).toBeVisible();
    await tabToElement(page, nextLessonButton, 40);

    const nextLessonFocusRing = await nextLessonButton.evaluate(
      (element) => getComputedStyle(element).boxShadow
    );
    expect(nextLessonFocusRing).not.toBe('none');

    await page.keyboard.press('Enter');
    await page.waitForURL(
      (url) => url.searchParams.get('lesson') === 'module-01-lesson-02',
      { timeout: 20_000 }
    );

    await page.screenshot({
      path: MOBILE_BASELINE_SCREENSHOT_PATH,
      fullPage: true,
      animations: 'disabled'
    });
  });
});
