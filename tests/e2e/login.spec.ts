import { expect, test } from '@playwright/test';

test.describe('login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders split layout and form elements', async ({ page }) => {
    await expect(
      page.getByText('Build data engineering that holds under load.')
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('toggles password visibility', async ({ page }) => {
    await page.getByLabel('Email').fill('qa@example.com');

    const password = page.locator('#login-password');
    await password.fill('Secret123!');
    await expect(password).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: 'Log in' })).toBeEnabled();

    const showButton = page.getByRole('button', { name: 'Show password' });
    await expect(showButton).toBeVisible();
    await showButton.click();
    await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();
    await expect(password).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('navigates to signup', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: 'Sign up free' });
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveAttribute('href', '/signup');
  });
});
