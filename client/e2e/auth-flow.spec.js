import { test, expect } from '@playwright/test';

test.describe('Auth Flow Smoke Test', () => {
  test('should load home, click login, and verify redirect to /auth', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Ensure the home page loaded by checking the title or a known heading
    await expect(page).toHaveTitle(/Chou Kaguya Hime|Wiki/i);

    // Locate the login link/button in the UI
    // Assuming there's a link or button with text 'Login' or an icon leading to /auth
    const loginButton = page.locator('a[href="/auth"], button:has-text("Login")').first();

    // Ensure the button is visible
    await expect(loginButton).toBeVisible();

    // Click the login button
    await loginButton.click();

    // Verify the URL changed to /auth
    await expect(page).toHaveURL(/.*\/auth/);

    // Verify the Auth page rendered (e.g. looking for a sign in form or text)
    const signInHeading = page.locator('h2:has-text("Sign in to your account"), h1:has-text("Login")').first();
    await expect(signInHeading).toBeVisible();
  });
});
