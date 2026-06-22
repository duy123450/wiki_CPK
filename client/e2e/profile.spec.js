import { test, expect } from '@playwright/test';

test.describe('Profile Management Flow', () => {
  // Use a unique username to avoid conflicts if testing against a live DB
  const testUser = {
    username: `e2e_profile_${Date.now()}`,
    email: `e2e_profile_${Date.now()}@test.com`,
    password: 'password123'
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to auth page to register a new user
    await page.goto('/auth');
    
    // Switch to register tab
    await page.getByRole('button', { name: /sign up/i }).click();

    // Fill registration form
    await page.getByPlaceholder('Username').fill(testUser.username);
    await page.getByPlaceholder('Email address').fill(testUser.email);
    // Use the specific selectors for password fields if placeholders aren't enough
    const passwords = page.getByPlaceholder('••••••••');
    await passwords.nth(0).fill(testUser.password);
    await passwords.nth(1).fill(testUser.password);

    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for redirect to home or profile
    await page.waitForURL('/');
  });

  test('should allow user to view and update profile', async ({ page }) => {
    // Navigate to profile
    await page.goto('/profile');

    // Verify profile page loaded correctly
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible();
    await expect(page.getByDisplayValue(testUser.username)).toBeVisible();

    // Update username
    const newUsername = `${testUser.username}_updated`;
    await page.getByLabel('Username').fill(newUsername);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify success toast or UI update
    await expect(page.getByText('Profile updated successfully')).toBeVisible();
    
    // Refresh to verify persistence
    await page.reload();
    await expect(page.getByDisplayValue(newUsername)).toBeVisible();
  });

  test('should display linked accounts section', async ({ page }) => {
    await page.goto('/profile');

    // Verify Linked Accounts section exists
    await expect(page.getByRole('heading', { name: 'Linked Accounts' })).toBeVisible();

    // Ensure buttons for linking exist (e.g., Google, Discord)
    await expect(page.getByRole('button', { name: /Link Google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Link Discord/i })).toBeVisible();
  });
});
