import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const testEmail = `test-${timestamp}@example.com`;
const testPassword = 'Test123456';
const testFullName = 'Test User';

test.describe('Authentication Error Messages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear any existing storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/');
  });

  test.describe('Login Errors', () => {
    test('should show error for empty email and password', async ({ page }) => {
      // Navigate to login
      await page.getByText('Sign In').first().click();
      await page.waitForTimeout(500);

      // Try to submit without filling fields
      const signInButton = page.getByRole('button', { name: /sign in/i }).first();
      await signInButton.click();

      // Wait for alert
      await page.waitForTimeout(1000);

      // Check for alert dialog
      const alert = page.getByRole('alert').or(page.locator('dialog')).first();
      await expect(alert).toBeVisible({ timeout: 3000 });

      const alertText = await alert.textContent();
      expect(alertText).toContain('Please fill in all fields');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // Navigate to login
      await page.getByText('Sign In').first().click();
      await page.waitForTimeout(500);

      // Fill in wrong credentials
      const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first();
      await emailInput.fill('nonexistent@example.com');

      const passwordInput = page.getByPlaceholder(/password/i).first();
      await passwordInput.fill('WrongPassword123');

      const signInButton = page.getByRole('button', { name: /sign in/i }).first();
      await signInButton.click();

      // Wait for response
      await page.waitForTimeout(3000);

      // Check for error alert
      const alert = page.getByRole('alert').or(page.locator('dialog')).first();
      await expect(alert).toBeVisible({ timeout: 5000 });

      const alertText = await alert.textContent();
      expect(alertText?.toLowerCase()).toContain('invalid');
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Navigate to login
      await page.getByText('Sign In').first().click();
      await page.waitForTimeout(500);

      // Simulate network error by using wrong URL
      await page.route('**/api/auth/login', route => route.abort());

      const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first();
      await emailInput.fill('test@example.com');

      const passwordInput = page.getByPlaceholder(/password/i).first();
      await passwordInput.fill('Password123');

      const signInButton = page.getByRole('button', { name: /sign in/i }).first();
      await signInButton.click();

      // Wait for error
      await page.waitForTimeout(3000);

      // Check for error alert
      const alert = page.getByRole('alert').or(page.locator('dialog')).first();
      await expect(alert).toBeVisible({ timeout: 5000 });

      const alertText = await alert.textContent();
      expect(alertText?.toLowerCase()).toMatch(/network|error|connection/i);
    });
  });

  test.describe('Registration Errors', () => {
    test('should show error for empty fields', async ({ page }) => {
      // Navigate to register
      await page.getByText('Sign Up').first().click();
      await page.waitForTimeout(500);

      // Try to submit without filling fields
      const signUpButton = page.getByRole('button', { name: /sign up/i }).first();
      await signUpButton.click();

      // Wait for alert
      await page.waitForTimeout(1000);

      const alert = page.getByRole('alert').or(page.locator('dialog')).first();
      await expect(alert).toBeVisible({ timeout: 3000 });

      const alertText = await alert.textContent();
      expect(alertText).toContain('Please fill in all fields');
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      // Navigate to register
      await page.getByText('Sign Up').first().click();
      await page.waitForTimeout(500);

      // Fill form with mismatched passwords
      await page.getByPlaceholder(/full name/i).fill('Test User');
      await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill('test@example.com');

      const passwordInputs = page.getByPlaceholder(/password/i).all();
      await passwordInputs.then(inputs => inputs[0].fill('Password123'));
      await passwordInputs.then(inputs => inputs[1].fill('Different123'));

      const signUpButton = page.getByRole('button', { name: /sign up/i }).first();
      await signUpButton.click();

      // Wait for client-side validation
      await page.waitForTimeout(1000);

      const alert = page.getByRole('alert').or(page.locator('dialog')).first();
      await expect(alert).toBeVisible({ timeout: 3000 });

      const alertText = await alert.textContent();
      expect(alertText).toContain('Passwords do not match');
    });

    test('should show error for short password', async ({ page }) => {
      // Navigate to register
      await page.getByText('Sign Up').first().click();
      await page.waitForTimeout(500);

      // Fill form with short password
      await page.getByPlaceholder(/full name/i).fill('Test User');
      await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill('test@example.com');

      const passwordInputs = page.getByPlaceholder(/password/i).all();
      await passwordInputs.then(inputs => inputs[0].fill('Short1'));
      await passwordInputs.then(inputs => inputs[1].fill('Short1'));

      const signUpButton = page.getByRole('button', { name: /sign up/i }).first();
      await signUpButton.click();

      // Wait for validation
      await page.waitForTimeout(1000);

      const alert = page.getByRole('alert').or(page.locator('dialog')).first();
      await expect(alert).toBeVisible({ timeout: 3000 });

      const alertText = await alert.textContent();
      expect(alertText).toContain('Password must be at least 8 characters');
    });

    test('should show error for invalid email format', async ({ page }) => {
      // Navigate to register
      await page.getByText('Sign Up').first().click();
      await page.waitForTimeout(500);

      // Fill form with invalid email
      await page.getByPlaceholder(/full name/i).fill('Test User');
      await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill('invalid-email');

      const passwordInputs = page.getByPlaceholder(/password/i).all();
      await passwordInputs.then(inputs => inputs[0].fill('Password123'));
      await passwordInputs.then(inputs => inputs[1].fill('Password123'));

      const signUpButton = page.getByRole('button', { name: /sign up/i }).first();
      await signUpButton.click();

      // Wait for server response
      await page.waitForTimeout(3000);

      const alert = page.getByRole('alert').or(page.locator('dialog')).first();
      await expect(alert).toBeVisible({ timeout: 5000 });

      const alertText = await alert.textContent();
      expect(alertText?.toLowerCase()).toContain('email');
    });

    test('should show error for duplicate email registration', async ({ page }) => {
      // First register
      await page.getByText('Sign Up').first().click();
      await page.waitForTimeout(500);

      await page.getByPlaceholder(/full name/i).fill('First User');
      await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill('duplicate-test@example.com');

      const passwordInputs = page.getByPlaceholder(/password/i).all();
      await passwordInputs.then(inputs => inputs[0].fill('Password123'));
      await passwordInputs.then(inputs => inputs[1].fill('Password123'));

      const signUpButton = page.getByRole('button', { name: /sign up/i }).first();
      await signUpButton.click();

      // Wait for success
      await page.waitForTimeout(4000);

      // Go back to try registering again
      const backButton = page.locator('svg').first();
      await backButton.click();
      await page.waitForTimeout(500);

      // Navigate to register again
      await page.getByText('Sign Up').first().click();
      await page.waitForTimeout(500);

      // Try to register with same email
      await page.getByPlaceholder(/full name/i).fill('Second User');
      await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill('duplicate-test@example.com');

      const passwordInputs2 = page.getByPlaceholder(/password/i).all();
      await passwordInputs2.then(inputs => inputs[0].fill('Password123'));
      await passwordInputs2.then(inputs => inputs[1].fill('Password123'));

      const signUpButton2 = page.getByRole('button', { name: /sign up/i }).first();
      await signUpButton2.click();

      // Wait for error response
      await page.waitForTimeout(3000);

      const alert = page.getByRole('alert').or(page.locator('dialog')).first();
      await expect(alert).toBeVisible({ timeout: 5000 });

      const alertText = await alert.textContent();
      expect(alertText?.toLowerCase()).toContain('already');
    });
  });

  test.describe('OTP Verification Errors', () => {
    test('should show error for incomplete OTP', async ({ page }) => {
      // Register first
      await page.getByText('Sign Up').first().click();
      await page.waitForTimeout(500);

      await page.getByPlaceholder(/full name/i).fill(`OTP User ${timestamp}`);
      await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill(testEmail);

      const passwordInputs = page.getByPlaceholder(/password/i).all();
      await passwordInputs.then(inputs => inputs[0].fill(testPassword));
      await passwordInputs.then(inputs => inputs[1].fill(testPassword));

      const signUpButton = page.getByRole('button', { name: /sign up/i }).first();
      await signUpButton.click();

      // Wait for navigation to OTP screen
      await page.waitForTimeout(4000);

      // Only fill 3 digits
      const otpInputs = await page.locator('input[maxlength="1"]').all();
      for (let i = 0; i < 3; i++) {
        await otpInputs[i].fill('1');
      }

      const verifyButton = page.getByRole('button', { name: /verify now/i }).first();
      await verifyButton.click();

      // Wait for client-side validation
      await page.waitForTimeout(1000);

      const alert = page.getByRole('alert').or(page.locator('dialog')).first();
      await expect(alert).toBeVisible({ timeout: 3000 });

      const alertText = await alert.textContent();
      expect(alertText).toContain('complete');
    });

    test('should show error for invalid OTP code', async ({ page }) => {
      // Register first
      await page.getByText('Sign Up').first().click();
      await page.waitForTimeout(500);

      await page.getByPlaceholder(/full name/i).fill(`OTP Invalid ${timestamp}`);
      await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill(`otp-invalid-${timestamp}@example.com`);

      const passwordInputs = page.getByPlaceholder(/password/i).all();
      await passwordInputs.then(inputs => inputs[0].fill(testPassword));
      await passwordInputs.then(inputs => inputs[1].fill(testPassword));

      const signUpButton = page.getByRole('button', { name: /sign up/i }).first();
      await signUpButton.click();

      // Wait for navigation to OTP screen
      await page.waitForTimeout(4000);

      // Fill wrong OTP
      const otpInputs = await page.locator('input[maxlength="1"]').all();
      for (const input of otpInputs) {
        await input.fill('1');
      }

      const verifyButton = page.getByRole('button', { name: /verify now/i }).first();
      await verifyButton.click();

      // Wait for server response
      await page.waitForTimeout(3000);

      const alert = page.getByRole('alert').or(page.locator('dialog')).first();
      await expect(alert).toBeVisible({ timeout: 5000 });

      const alertText = await alert.textContent();
      expect(alertText?.toLowerCase()).toMatch(/incorrect|invalid/i);
    });
  });
});
