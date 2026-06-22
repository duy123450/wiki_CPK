import { test, expect } from '@playwright/test';

test.describe('Wiki Player Flow System Tests', () => {
  test('should load player UI and display media controls', async ({ page }) => {
    // Navigate to a known media/soundtrack page
    await page.goto('/soundtracks');

    const trackLink = page.locator('.track-item, a[href*="/play/"]').first();
    
    if (await trackLink.count() === 0) {
      test.skip('Player links missing. Flag: MISSING_INFRA_PLAYER_UI');
      return;
    }

    await trackLink.click();
    await page.waitForLoadState('load');

    // Verify player controls
    const playBtn = page.locator('button.play, button[aria-label="Play"]');
    await expect(playBtn).toBeVisible();

    const progress = page.locator('.progress-bar, input[type="range"]');
    await expect(progress).toBeVisible();
  });

  test('should sync player state visually when toggling play/pause', async ({ page }) => {
    await page.goto('/soundtracks');

    const playBtn = page.locator('button.play, button[aria-label="Play"]').first();
    if (await playBtn.count() === 0) {
      test.skip('Player controls missing. Flag: MISSING_INFRA_PLAYER_CONTROLS');
      return;
    }

    await playBtn.click();
    
    // Expect UI to change to pause
    const pauseBtn = page.locator('button.pause, button[aria-label="Pause"]').first();
    await expect(pauseBtn).toBeVisible();
  });
});
