/**
 * Usage
 * 
 *  node screenshots [fb email] [fb password]
 * 
 */
const process = require('process')
const { chromium } = require('playwright')  // Or 'chromium' or 'webkit'.

    ;
(async () => {
    try {
        const args = process.argv.slice(2);

        const urls = [
            { id: 'cags', url: 'https://www.facebook.com/GSCBaternaAnnex' },
            { id: 'cas', url: 'https://www.facebook.com/profile.php?id=100063540535602' },
            { id: 'cbm', url: 'https://www.facebook.com/cbmgsc.edu.ph' },
            { id: 'ccje', url: 'https://www.facebook.com/gscccje ' },
            { id: 'ceit', url: 'https://www.facebook.com/profile.php?id=100086602206519' },
            { id: 'cst', url: 'https://www.facebook.com/cstofficial2016' },
            { id: 'cte', url: 'https://www.facebook.com/gscCTE' },
            { id: 'gradschool', url: 'https://www.facebook.com/GradSchoolPage' },
        ]

        const capture = async (browser, id, url) => {
            const page = await browser.newPage();
            console.log(`Screenshotting ${id} at ${url}`)
            await page.goto(`${url}`, {
                waitUntil: 'networkidle',
                timeout: 60000, // 1 minute
            });

            await page.getByPlaceholder('Email or phone').fill(`${args[0]}`)
            await page.getByPlaceholder('Password').fill(`${args[1]}`)
            await page.keyboard.press('Enter');
            try {
                await page.waitForSelector('svg[aria-label="Your profile"]', {
                    timeout: 60000
                })
            } catch (error) {

            }
            await page.addStyleTag({
                content: 'div[role="banner"] { display:none; }'
            })
            await page.waitForLoadState('networkidle', {
                timeout: 60000
            })
            return page.screenshot({
                path: `./screenshots/page-${id}.png`,
                type: "png",
                fullPage: true
            });
        }
        const browser = await chromium.launch({ headless: false, devtools: false });

        let promises = urls.map((o) => {
            return capture(browser, o.id, o.url)
        })
        const results = await Promise.allSettled(promises)
        console.log(results.map((r, i) => `${urls[i].id} - ${r.status}`))
        await browser.close()
    } catch (error) {
        console.error(error)
    }
})();