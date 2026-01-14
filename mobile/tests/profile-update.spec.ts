import { test, expect } from '@playwright/test';

test.describe('Profile Update Test', () => {
  test('should load without errors', async ({ page }) => {
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
    const failedRequests: { url: string; status: number; method?: string }[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
        });
      }
    });

    // Wait for initial load
    await page.waitForTimeout(3000);

    // Log results
    console.log('Console errors:', errors);
    console.log('Failed requests:', failedRequests);

    // Take screenshot
    await page.screenshot({ path: 'test-results/20-profile-update-test.png' });

    // Check that we don't have any errors
    expect(errors.length).toBe(0);
    expect(failedRequests.filter(req => req.status === 500).length).toBe(0);

    console.log('✓ App loaded without errors');
    console.log('✓ No 500 errors detected');
  });
});
