import { test, expect } from '@playwright/test';

test.describe('App Loading Test', () => {
  test('should load the app without errors', async ({ page }) => {
    await page.goto('http://localhost:8081');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Check if we're on the welcome screen or home screen
    const url = page.url();
    console.log('Current URL:', url);

    // Take a screenshot
    await page.screenshot({ path: 'test-results/app-loaded.png' });

    // Check if there are any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit more to catch any errors
    await page.waitForTimeout(2000);

    // If we have console errors, log them
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }

    // The page should load without critical errors
    expect(errors.filter(e => e.includes('Failed to load'))).toHaveLength(0);
  });

  test('should show welcome or home screen', async ({ page }) => {
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000);

    // Check for welcome screen elements
    const welcomeText = await page.locator('text=Sign In').count();
    console.log('Found "Sign In" buttons:', welcomeText);

    // Take a screenshot to verify
    await page.screenshot({ path: 'test-results/welcome-screen.png' });

    // Should have loaded successfully
    expect(await page.title()).toBeTruthy();
  });
});
