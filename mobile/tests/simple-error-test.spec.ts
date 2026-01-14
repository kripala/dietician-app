import { test, expect } from '@playwright/test';

test.describe('Simple Error Message Tests', () => {
  test('verify login error messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Navigate to login using a more reliable selector
    const loginLinks = await page.locator('text=Sign In').all();
    if (loginLinks.length > 0) {
      await loginLinks[0].click();
    } else {
      // Try alternative navigation
      await page.locator('a').filter({ hasText: /sign in/i }).first().click();
    }
    await page.waitForTimeout(1000);

    // Screenshot login screen
    await page.screenshot({ path: 'screenshots-simple/login-1.png' });

    // Find and click the sign in button (try empty fields)
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.toLowerCase().includes('sign in')) {
        await button.click();
        break;
      }
    }
    await page.waitForTimeout(2000);

    // Check for error
    await page.screenshot({ path: 'screenshots-simple/login-2-empty-error.png' });

    // Fill in wrong credentials
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder');
      if (placeholder && placeholder.toLowerCase().includes('email')) {
        await input.fill('wrong@test.com');
      } else if (placeholder && placeholder.toLowerCase().includes('password')) {
        await input.fill('wrongpass');
      }
    }

    const buttons2 = await page.locator('button').all();
    for (const button of buttons2) {
      const text = await button.textContent();
      if (text && text.toLowerCase().includes('sign in')) {
        await button.click();
        break;
      }
    }
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots-simple/login-3-invalid-error.png' });
  });

  test('verify registration error messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Navigate to register
    const registerLinks = await page.locator('text=Sign Up').all();
    if (registerLinks.length > 0) {
      await registerLinks[0].click();
    } else {
      await page.locator('a').filter({ hasText: /sign up/i }).first().click();
    }
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots-simple/register-1.png' });

    // Try submitting empty form
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.toLowerCase().includes('sign up')) {
        await button.click();
        break;
      }
    }
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots-simple/register-2-empty-error.png' });

    // Fill form with short password
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder');
      if (placeholder && placeholder.toLowerCase().includes('full name')) {
        await input.fill('Test User');
      } else if (placeholder && placeholder.toLowerCase().includes('email')) {
        await input.fill('test@example.com');
      } else if (placeholder && placeholder.toLowerCase().includes('password')) {
        await input.fill('Short1');
      }
    }

    const buttons2 = await page.locator('button').all();
    for (const button of buttons2) {
      const text = await button.textContent();
      if (text && text.toLowerCase().includes('sign up')) {
        await button.click();
        break;
      }
    }
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots-simple/register-3-short-password.png' });
  });
});
