import { test, expect } from '@playwright/test';

test.describe('Profile Backend Test', () => {
  test('should handle profile endpoint correctly', async ({ page }) => {
    // Navigate to the app
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

    // Monitor network for profile requests
    const profileRequests: { url: string; status: number }[] = [];
    page.on('requestfinished', request => {
      const url = request.url();
      if (url.includes('/user-profiles/') || url.includes('/profile')) {
        const response = request.response();
        if (response) {
          profileRequests.push({
            url,
            status: response.status(),
          });
        }
      }
    });

    // Wait to capture any initial errors
    await page.waitForTimeout(5000);

    // Log results
    console.log('Console errors:', errors);
    console.log('Failed requests:', failedRequests);
    console.log('Profile requests:', profileRequests);

    // Take screenshot
    await page.screenshot({ path: 'test-results/04-home-screen.png' });

    // Check that we don't have 500 errors on profile endpoints
    const profile500Errors = failedRequests.filter(req =>
      req.url.includes('/user-profiles/') && req.status === 500
    );

    expect(profile500Errors.length).toBe(0);
    console.log('✓ No 500 errors on profile endpoints');
  });
});
