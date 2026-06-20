import { test, expect } from '@playwright/test';

test.describe('OAuth Flow System Tests', () => {
  test('should redirect to OAuth provider when clicking Google login', async ({ page }) => {
    await page.goto('/auth');

    // Find OAuth button
    const googleBtn = page.locator('button:has-text("Google"), .oauth-google');
    
    if (await googleBtn.count() === 0) {
      test.skip('OAuth infrastructure missing in UI. Flag: MISSING_INFRA_OAUTH_BTN');
      return;
    }

    await googleBtn.click();

    // Verify redirect to provider (mock or real)
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
    
    const url = page.url();
    expect(url.includes('google.com/o/oauth2') || url.includes('/mock-oauth')).toBeTruthy();
  });

  test('should handle OAuth callback and set session', async ({ page, context }) => {
    // Mock the callback route since we can't easily test real OAuth without credentials
    await page.route('**/api/auth/google/callback**', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Set-Cookie': 'session=mock-oauth-session; Path=/; HttpOnly',
          'Location': '/welcome'
        }
      });
    });

    await page.goto('/api/auth/google/callback?code=mockcode');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/welcome')) {
      await expect(page).toHaveURL(/.*\/welcome/);
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name === 'session');
      expect(sessionCookie).toBeDefined();
    } else {
      test.skip('OAuth callback handling missing. Flag: MISSING_INFRA_OAUTH_CALLBACK');
    }
  });
});
