import { test, expect } from '@playwright/test';

/**
 * E2E Session Expiry Tests
 *
 * These tests verify that when access tokens expire and refresh tokens fail,
 * the application correctly redirects the user to /auth without hanging,
 * crashing, or leaving the user stuck in a broken authenticated state.
 *
 * Strategy:
 *   - Intercept /api/auth/refresh-token to return 401 (simulating a revoked
 *     or expired refresh token).
 *   - Intercept any authenticated API call to return 401 (simulating an
 *     expired access token that cannot be refreshed).
 *   - Verify the app cleanly redirects to /auth.
 */

test.describe('Session Expiry & Token Refresh Failure', () => {
  test('should redirect to /auth when both access and refresh tokens are expired', async ({ page }) => {
    // Intercept the silent refresh endpoint to simulate a fully expired session
    await page.route('**/api/auth/refresh', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Refresh token expired or revoked' }),
      });
    });

    // Intercept authenticated data endpoints to simulate expired access token
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Access token expired' }),
      });
    });

    // Navigate to a protected route — the app should attempt to restore session,
    // fail, and redirect to /auth
    await page.goto('/profile');
    
    // Use Playwright's built-in assertion to wait for the redirect
    await expect(page).toHaveURL(/.*\/auth/, { timeout: 10000 });
  });

  test('should redirect to /auth after a 401 on an authenticated API action', async ({ page }) => {
    // Allow page to load normally first
    await page.goto('/');
    await page.waitForLoadState('load');

    // Now start intercepting all API calls to return 401
    await page.route('**/api/**', (route) => {
      // Let refresh fail too
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      });
    });

    // Try navigating to a protected page — the 401 interceptor on /api/auth/me
    // should trigger logout / redirect
    await page.goto('/profile');

    // Wait for the redirect to happen
    await expect(page).toHaveURL(/.*\/auth/, { timeout: 10000 });
  });

  test('should not leave the user stuck on a loading spinner after session expiry', async ({ page }) => {
    // Simulate session expiry from the start
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      });
    });

    await page.route('**/api/auth/refresh', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      });
    });

    await page.goto('/');
    // Give a reasonable window for the app to settle
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Ensure there's no permanent loading spinner visible
    const spinner = page.locator('[data-testid="loading-spinner"], .spinner, .loading');
    const spinnerVisible = await spinner.isVisible().catch(() => false);
    expect(spinnerVisible).toBe(false);

    // And the body has real content (not blank)
    const bodyText = await page.textContent('body');
    expect(bodyText.trim().length).toBeGreaterThan(10);
  });
});
