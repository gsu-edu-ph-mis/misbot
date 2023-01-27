const { chromium } = require('playwright');  // Or 'chromium' or 'webkit'.

(async () => {
  const browser = await chromium.launch({ headless: false, devtools: false });
  const page = await browser.newPage();
  await page.goto('https://www.facebook.com');
  await page.getByPlaceholder('Email or phone number').fill('xx')
  await page.getByPlaceholder('Password').fill('xx')
  await page.click('button[type="submit"]')

  await page.click('text="What\'s on your mind, Nick?"')
  await page.fill('div[aria-label="What\'s on your mind, Nick?"]', 'test post.')

  await browser.close();
})();