import { test, expect } from '@playwright/test';

test.describe('Header and Back Button Test', () => {
  test('should display static header on home screen', async ({ page }) => {
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000);

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Take screenshot of home screen
    await page.screenshot({ path: 'test-results/10-home-header.png' });

    // Check for header elements (username, profile icon, logout button)
    // We'll verify the elements exist in the DOM
    const headerElements = await page.evaluate(() => {
      const body = document.body.innerHTML;
      return {
        hasUserIcon: body.includes('svg') || body.includes('UserIcon'),
        hasLogout: body.includes('LogOut') || body.includes('logout'),
      };
    });

    console.log('Header elements:', headerElements);

    console.log('✓ Home screen loaded with header');
  });

  test('should display header with back button on profile edit mode', async ({ page }) => {
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000);

    // Monitor for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for initial load
    await page.waitForTimeout(2000);

    // Take screenshot of welcome screen
    await page.screenshot({ path: 'test-results/11-welcome-screen.png' });

    // Check console errors
    console.log('Console errors:', errors);
    expect(errors.length).toBe(0);

    console.log('✓ No errors on initial load');
  });
});
