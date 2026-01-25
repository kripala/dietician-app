const { chromium } = require('playwright');

(async () => {
  // Launch Chrome with remote debugging enabled for manual testing
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  // Remove navigator.webdriver
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  console.log('=== Manual OAuth Test Started ===');
  console.log('Opening http://localhost:8081...');

  await page.goto('http://localhost:8081');
  await page.waitForLoadState('networkidle');

  console.log('Page loaded. Please complete the flow manually:');
  console.log('1. Click "Get Started"');
  console.log('2. Click "Sign up with Google"');
  console.log('3. Select vaibhav.kripala@gmail.com account');
  console.log('4. Check if you land on home page or login page');

  // Keep browser open for manual testing
  console.log('\nBrowser is open. Press Ctrl+C to exit when done.');

  // Monitor URL changes
  page.on('load', () => {
    console.log('Page loaded:', page.url());
    if (page.url().includes('oauth-callback')) {
      console.log('>>> ON CALLBACK PAGE <<<');
    }
    if (!page.url().includes('login') && !page.url().includes('oauth-callback') && !page.url().includes('accounts.google')) {
      console.log('>>> POSSIBLY ON HOME PAGE (not login/callback) <<<');
    }
  });

  // Don't close browser
  // await browser.close();
})();
