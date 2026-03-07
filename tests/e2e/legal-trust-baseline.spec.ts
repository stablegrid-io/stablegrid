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

test.describe('legal and trust baseline', () => {
  test('keeps GDPR endpoints auth-protected', async ({ request }) => {
    const exportResponse = await request.post('/api/gdpr/export');
    expect(exportResponse.status()).toBe(401);

    const deleteAccountResponse = await request.delete('/api/gdpr/delete-account');
    expect(deleteAccountResponse.status()).toBe(401);

    const deleteReasonResponse = await request.post('/api/gdpr/delete-reason', {
      data: { reason: 'privacy_check' }
    });
    expect(deleteReasonResponse.status()).toBe(401);
  });

  test('keeps legal and support links reachable from public auth surfaces', async ({
    page
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('link', { name: /^privacy$/i }).first()).toHaveAttribute(
      'href',
      '/privacy'
    );
    await expect(page.getByRole('link', { name: /^terms$/i }).first()).toHaveAttribute(
      'href',
      '/terms'
    );
    await expect(page.getByRole('link', { name: /^support$/i }).first()).toHaveAttribute(
      'href',
      '/support'
    );

    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page.getByRole('link', { name: /^privacy$/i })).toHaveAttribute(
      'href',
      '/privacy'
    );
    await expect(page.getByRole('link', { name: /^terms$/i })).toHaveAttribute(
      'href',
      '/terms'
    );
    await expect(page.getByRole('link', { name: /^support$/i })).toHaveAttribute(
      'href',
      '/support'
    );

    await page.goto('/signup', { waitUntil: 'networkidle' });
    await expect(page.getByRole('link', { name: /^terms$/i })).toHaveAttribute(
      'href',
      '/terms'
    );
    await expect(page.getByRole('link', { name: /^privacy policy$/i })).toHaveAttribute(
      'href',
      '/privacy'
    );
    await expect(page.getByRole('link', { name: /contact support/i })).toHaveAttribute(
      'href',
      '/support'
    );
  });

  test.skip(
    !HAS_E2E_CREDENTIALS,
    'Set STABLEGRID_E2E_EMAIL and STABLEGRID_E2E_PASSWORD to run without creating test users.'
  );

  test('keeps legal and support pages reachable from authenticated settings hub', async ({
    page
  }) => {
    const credentials: E2ECredentials = {
      email: E2E_EMAIL,
      password: E2E_PASSWORD
    };

    await login(page, credentials);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /open profile menu/i }).click();
    await page.getByRole('link', { name: /^settings$/i }).click();
    await expect(page).toHaveURL(/\/settings/);

    const privacyLink = page.getByRole('link', { name: /^privacy$/i });
    const termsLink = page.getByRole('link', { name: /^terms$/i });
    const supportLink = page.getByRole('link', { name: /^support$/i });

    await expect(privacyLink).toBeVisible();
    await privacyLink.click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /^terms$/i }).click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.getByRole('heading', { name: /terms of use/i })).toBeVisible();

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /^support$/i }).click();
    await expect(page).toHaveURL(/\/support$/);
    await expect(page.getByRole('heading', { name: /^support$/i })).toBeVisible();
  });
});
