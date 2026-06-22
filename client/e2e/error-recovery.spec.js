import { test, expect } from '@playwright/test';

/**
 * E2E Error Recovery Tests
 *
 * These tests verify the application handles backend failures gracefully
 * by intercepting network requests and simulating server errors.
 * The app should never crash or show a blank screen — it must display
 * user-friendly error feedback.
 */

test.describe('Error Recovery: Network & Server Failures', () => {
  test('should show error feedback when character page returns 500', async ({ page }) => {
    // Intercept the API call for a character and force a 500 response
    await page.route('**/api/characters/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await page.goto('/characters/kaguya');
    await page.waitForLoadState('load');

    // The page should NOT be blank — it should display an error state
    // Acceptable outcomes: error message, "not found" card, or fallback UI
    const pageBody = await page.textContent('body');
    const hasErrorFeedback =
      (await page.locator('[data-testid="error-message"]').isVisible().catch(() => false)) ||
      pageBody.includes('Error') ||
      pageBody.includes('error') ||
      pageBody.includes('Something went wrong') ||
      pageBody.includes('not found') ||
      pageBody.includes('Not Found');

    expect(hasErrorFeedback).toBe(true);
  });

  test('should show error feedback when soundtracks page returns 500', async ({ page }) => {
    await page.route('**/api/soundtracks/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await page.goto('/soundtracks/some-track');
    await page.waitForLoadState('load');

    const pageBody = await page.textContent('body');
    const hasErrorFeedback =
      (await page.locator('[data-testid="error-message"]').isVisible().catch(() => false)) ||
      pageBody.includes('Error') ||
      pageBody.includes('error') ||
      pageBody.includes('Something went wrong') ||
      pageBody.includes('not found') ||
      pageBody.includes('Not Found');

    expect(hasErrorFeedback).toBe(true);
  });

  test('should not crash on network failure when loading home page data', async ({ page }) => {
    // Simulate a dropped network connection for API calls
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await page.goto('/');
    await page.waitForLoadState('load');

    // The page structure should still be intact — navigation should be visible
    // and the app should not show a blank white page
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Core navigation / shell should still render
    const hasContent = (await page.locator('nav, header, main, [role="navigation"]').count()) > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle 404 gracefully with a user-friendly page', async ({ page }) => {
    await page.goto('/this-route-definitely-does-not-exist');
    await page.waitForLoadState('load');

    // Either a dedicated 404 component, or the app redirects/shows some fallback
    const pageBody = await page.textContent('body');
    const has404Feedback =
      pageBody.includes('404') ||
      pageBody.includes('Not Found') ||
      pageBody.includes('not found') ||
      pageBody.includes("doesn't exist") ||
      pageBody.includes('Page not found');

    expect(has404Feedback).toBe(true);
  });
});
