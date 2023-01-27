/**
 * Usage
 * CEIT
 *  node screenshot [email] [password] ceit https://www.facebook.com/profile.php?id=100086602206519
 * 
 */
const process = require('process')
const { chromium } = require('playwright')  // Or 'chromium' or 'webkit'.

    ;
(async () => {
    try {
        const browser = await chromium.launch({ headless: false, devtools: false });
        const page = await browser.newPage();
        const args = process.argv.slice(2);
        await page.goto(`${args[3]}`, {
            waitUntil: 'networkidle'
        });

        await page.getByPlaceholder('Email or phone').fill(`${args[0]}`)
        await page.getByPlaceholder('Password').fill(`${args[1]}`)
        await page.keyboard.press('Enter');
        await page.waitForSelector('svg[aria-label="Your profile"]')
        await page.addStyleTag({
            content: 'div[role="banner"] { display:none; }'
        })
        await page.waitForLoadState('networkidle')
        await page.screenshot({ 
            path: `./screenshots/page-${args[2]}.png`, 
            type: "png", 
            fullPage: true 
        });
        await browser.close();
    } catch (error) {
        console.error(error)
    }
})();