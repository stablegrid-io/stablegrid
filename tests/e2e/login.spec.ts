import { expect, test } from '@playwright/test';

test.describe('login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders split layout and form elements', async ({ page }) => {
    await expect(page.getByText('Learn data engineering.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('toggles password visibility', async ({ page }) => {
    const password = page.locator('#login-password');
    await password.fill('Secret123!');
    await expect(password).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('navigates to signup', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up free' }).click();
    await expect(page).toHaveURL(/\/signup$/);
  });
});
