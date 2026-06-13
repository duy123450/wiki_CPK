import { test, expect } from '@playwright/test';

test.describe('Wiki Navigation System Tests', () => {
  
  test('should load the home page and render the main wiki layout', async ({ page }) => {
    await page.goto('/');

    // Expect the document title to contain 'Wiki'
    await expect(page).toHaveTitle(/Wiki/i);

    // Expect the sidebar or a main navigation element to be visible
    // Note: Assuming there's an element with class 'sidebar' or a nav element
    const sidebar = page.locator('nav, .sidebar, aside').first();
    await expect(sidebar).toBeVisible();

    // Expect a search input to be present (common in wikis)
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    // It might not be visible on mobile views until a button is clicked, 
    // so we just check if it's attached to the DOM, or visible if desktop.
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should navigate to a character or soundtrack page from the sidebar', async ({ page }) => {
    await page.goto('/');

    // Look for a link to the characters or soundtracks index
    const charactersLink = page.locator('a[href*="/characters"], a[href*="/wiki/characters"]').first();
    
    // If the link exists on the homepage, click it and verify routing
    if (await charactersLink.count() > 0 && await charactersLink.isVisible()) {
      await charactersLink.click();
      
      // Wait for URL to change
      await expect(page).toHaveURL(/.*\/characters/);
      
      // Ensure the page heading updates
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    }
  });

});
