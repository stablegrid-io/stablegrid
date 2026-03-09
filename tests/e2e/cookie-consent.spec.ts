import { expect, test } from '@playwright/test';

const CONSENT_STORAGE_KEY = 'stablegrid-cookie-consent';

test.describe('cookie consent baseline', () => {
  test('keeps analytics blocked before consent and supports one-click reject on first layer', async ({
    page
  }) => {
    let analyticsRequestCount = 0;

    await page.route('**/api/analytics/events', async (route) => {
      analyticsRequestCount += 1;
      await route.fulfill({
        status: 204,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true })
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    const consentBanner = page.locator('section[aria-label="Cookie consent"]');
    const rejectAllButton = consentBanner.getByRole('button', { name: /^reject all$/i });

    await expect(consentBanner).toBeVisible();
    await expect(rejectAllButton).toBeVisible();
    expect(analyticsRequestCount).toBe(0);

    await rejectAllButton.click();

    await expect(consentBanner).toBeHidden();
    await expect(page.getByRole('button', { name: /^cookie settings$/i }).first()).toBeVisible();

    const storedConsent = await page.evaluate((storageKey) => {
      try {
        const rawValue = window.localStorage.getItem(storageKey);
        return rawValue ? JSON.parse(rawValue) : null;
      } catch {
        return null;
      }
    }, CONSENT_STORAGE_KEY);

    expect(storedConsent).toMatchObject({
      source: 'banner_reject_all',
      consent: {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false
      }
    });

    const cookies = await page.evaluate(() => document.cookie);
    expect(cookies.includes('stablegrid_cookie_consent=')).toBe(true);

    await page.waitForTimeout(600);
    expect(analyticsRequestCount).toBe(0);
  });
});
