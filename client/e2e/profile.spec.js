import { test, expect } from '@playwright/test';

/**
 * Profile Page E2E Tests
 *
 * Based on actual ProfilePage.jsx DOM structure:
 * - Unauthenticated users see "Not signed in" with a Go to login link
 * - Authenticated users see: Edit Profile form, Account Info, Change Password, Danger Zone
 * - No "Linked Accounts" section exists in the current UI
 *
 * Note: The beforeEach tries to register a fresh test user each time.
 * The register tab text is "Register" (not "Sign up").
 * Form fields use react-hook-form `name` attributes.
 */

test.describe('Profile Page — Unauthenticated', () => {
  test('should redirect or show login prompt when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    // Wait for ProtectedRoute's session restore to finish and redirect to /auth
    // isRestoringSession starts true, so we must wait past the null-render phase
    await page.waitForURL('**/auth', { timeout: 10000 }).catch(() => {});

    const currentUrl = page.url();
    const isOnAuthPage = currentUrl.includes('/auth');
    const isOnProfilePage = currentUrl.includes('/profile');

    if (isOnAuthPage) {
      await expect(page).toHaveURL(/.*\/auth/);
    } else if (isOnProfilePage) {
      // ProfilePage renders its own "Not signed in" fallback (if ProtectedRoute is absent)
      await expect(page.getByText('Not signed in')).toBeVisible();
      await expect(page.getByText('Go to login')).toBeVisible();
    }
  });
});

test.describe('Profile Page — Authenticated', () => {
  let testUser;

  // Helper: dismiss the cookie consent dialog if visible
  async function dismissCookieConsent(page) {
    try {
      const acceptBtn = page.locator('button:has-text("Accept all"), button:has-text("Accept")');
      if (await acceptBtn.first().isVisible({ timeout: 2000 })) {
        await acceptBtn.first().click();
        await page.waitForTimeout(300);
      }
    } catch {
      // no dialog — proceed
    }
  }

  test.beforeEach(async ({ page }) => {
    // Generate a short unique username (max 20 chars allowed)
    const uniqueId = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
    testUser = {
      username: `user_${uniqueId}`,
      email: `user_${uniqueId}@test.com`,
      password: 'password123'
    };

    // Register a fresh test user before each test
    await page.goto('/auth');
    await page.waitForLoadState('load');

    // Switch to Register tab — button text is "Register"
    await page.locator('button.auth-tab', { hasText: 'Register' }).click();

    // Fill registration form using react-hook-form name attributes
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);

    await page.locator('button.auth-submit').click();

    // Wait for successful registration — redirects to /welcome
    await page.waitForURL('**/welcome', { timeout: 15000 });
  });

  test('should display the profile page with correct sections', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('load');
    await dismissCookieConsent(page);

    // Header badge
    await expect(page.locator('.profile-badge')).toContainText('Profile Settings');

    // Edit Profile section
    await expect(page.locator('.profile-card-title', { hasText: 'Edit Profile' })).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();

    // Account Info section
    await expect(page.locator('.profile-card-title', { hasText: 'Account Info' })).toBeVisible();

    // Change Password section
    await expect(page.locator('.profile-card-title', { hasText: 'Change Password' })).toBeVisible();

    // Danger Zone section
    await expect(page.locator('.profile-card-title', { hasText: 'Danger Zone' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Delete Account' })).toBeVisible();
  });

  test('should allow user to update username', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('load');
    await dismissCookieConsent(page);

    // Wait for profile form to be populated (react-hook-form reset after fetch)
    await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="username"]')).not.toHaveValue('', { timeout: 10000 });

    const newUsername = `${testUser.username}_upd`;

    // Triple-click to select all text then type replacement — this triggers
    // react-hook-form's onChange so isDirty becomes true and the button enables.
    await page.locator('input[name="username"]').click({ clickCount: 3 });
    await page.locator('input[name="username"]').pressSequentially(newUsername, { delay: 30 });

    // Wait for the Save button to become enabled
    await expect(page.locator('button.profile-btn--primary')).toBeEnabled({ timeout: 5000 });

    // Submit
    await page.locator('button.profile-btn--primary').click();

    // Verify success toast
    await expect(page.locator('.profile-toast--success')).toBeVisible({ timeout: 8000 });
  });

  test('should show confirmation dialog before deleting account', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('load');
    await dismissCookieConsent(page);

    // Wait for profile page to be ready
    await expect(page.locator('button', { hasText: 'Delete Account' })).toBeVisible({ timeout: 10000 });

    // Click the initial delete button
    await page.locator('button', { hasText: 'Delete Account' }).click();

    // Confirmation dialog should appear
    await expect(page.getByText('Are you absolutely sure?')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Yes, delete my account' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Cancel' })).toBeVisible();

    // Cancel and verify dialog disappears
    await page.locator('button', { hasText: 'Cancel' }).click();
    await expect(page.getByText('Are you absolutely sure?')).not.toBeVisible();
  });
});
