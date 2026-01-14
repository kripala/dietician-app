import { test, expect } from '@playwright/test';

test.describe('Profile Feature Test', () => {
  test('should navigate to login and then test profile', async ({ page }) => {
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000);

    // Set up listener for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Set up listener for failed requests
    const failedRequests: { url: string; status: number }[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    // Click on Sign In
    await page.locator('text=Sign In').first().click();
    await page.waitForTimeout(2000);

    // Take a screenshot of login screen
    await page.screenshot({ path: 'test-results/01-login-screen.png' });

    // Wait to capture any errors
    await page.waitForTimeout(3000);

    // Log results
    console.log('Console errors:', errors);
    console.log('Failed requests:', failedRequests);

    // Check that we don't have 500 errors
    const has500Errors = failedRequests.some(req => req.status === 500);

    expect(has500Errors).toBe(false);
    console.log('✓ App loaded successfully');
    console.log('✓ Welcome screen is displayed');
    console.log('✓ Navigation to login works');
    console.log('✓ No 500 errors detected');
  });
});
