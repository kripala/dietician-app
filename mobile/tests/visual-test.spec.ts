import { test, expect } from '@playwright/test';

test.describe('Visual Authentication Error Tests', () => {
  test('manual test: check all authentication error messages', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Take a screenshot of the welcome screen
    await page.screenshot({ path: 'screenshots/01-welcome.png' });

    // Navigate to login
    await page.getByText('Sign In').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/02-login-screen.png' });

    // Try empty fields
    const signInButton = page.locator('button').filter({ hasText: /sign in/i }).first();
    await signInButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/03-empty-fields-error.png' });

    // Try invalid credentials
    await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill('wrong@example.com');
    await page.getByPlaceholder(/password/i).first().fill('wrongpass');
    await signInButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/04-invalid-credentials-error.png' });

    // Go to register
    const backButton = page.locator('svg').first();
    await backButton.click();
    await page.waitForTimeout(500);

    await page.getByText('Sign Up').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/05-register-screen.png' });

    // Try empty fields
    await page.locator('button').filter({ hasText: /sign up/i }).first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/06-register-empty-fields-error.png' });

    // Try short password
    await page.getByPlaceholder(/full name/i).fill('Test User');
    await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill('test@example.com');

    const passwordInputs = page.getByPlaceholder(/password/i).all();
    await passwordInputs.then(inputs => inputs[0].fill('Short1'));
    await passwordInputs.then(inputs => inputs[1].fill('Short1'));

    await page.locator('button').filter({ hasText: /sign up/i }).first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/07-short-password-error.png' });

    // Try mismatched passwords
    await passwordInputs.then(inputs => inputs[0].fill('Password123'));
    await passwordInputs.then(inputs => inputs[1].fill('Different123'));

    await page.locator('button').filter({ hasText: /sign up/i }).first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/08-mismatched-passwords-error.png' });

    // Try invalid email
    await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill('invalid-email');
    await passwordInputs.then(inputs => inputs[0].fill('Password123'));
    await passwordInputs.then(inputs => inputs[1].fill('Password123'));

    await page.locator('button').filter({ hasText: /sign up/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/09-invalid-email-error.png' });

    // Try duplicate email (first register)
    await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill('duplicate-visual@example.com');
    await page.getByPlaceholder(/full name/i).fill('First User');

    await page.locator('button').filter({ hasText: /sign up/i }).first().click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/10-after-first-register.png' });

    // Go back and try again
    await page.locator('svg').first().click();
    await page.waitForTimeout(500);
    await page.getByText('Sign Up').first().click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/full name/i).fill('Second User');
    await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill('duplicate-visual@example.com');

    const passwordInputs2 = page.getByPlaceholder(/password/i).all();
    await passwordInputs2.then(inputs => inputs[0].fill('Password123'));
    await passwordInputs2.then(inputs => inputs[1].fill('Password123'));

    await page.locator('button').filter({ hasText: /sign up/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/11-duplicate-email-error.png' });
  });
});
