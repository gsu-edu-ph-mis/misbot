/**
 * Usage
 * 
 *  node sias-term-grades [username] [admin password]
 * 
 *  node sias-term-grades USERNAME PASSWORD 2020-1-0649 22-1
 * 
 */

const fs = require('fs')
const { chromium } = require('playwright')  // Or 'chromium' or 'webkit'.

// Return filePath or throw on error
module.exports = async (args) => {
    let browser = null
    try {
        const USERNAME = args[0]
        const PASSWORD = args[1]
        const ID = args[2]
        const SEM = args[3]
        const URL = args[4]
        const DIR = args[5]
        const CONSOLE = args[6]

        const filePath = `${DIR}/term-grades-${ID}-${SEM}.xlsx`
        if (fs.existsSync(filePath)) {
            if (CONSOLE) console.log(`Load grades from file ${filePath}`)
            return filePath
        }
        if (CONSOLE) console.log(`Download grades from network`)

        browser = await chromium.launch({
            // headless: false,
            // devtools: true,
        });
        const page = await browser.newPage();
        await page.goto(URL, {
            waitUntil: 'networkidle',
        });

        await page.locator("text='Administrator'").click()
        await page.locator(`input[type="password"]`).nth(0).type(USERNAME)
        await page.locator(`input[type="password"]`).nth(1).type(PASSWORD)
        await page.locator("text='Login'").click()

        await page.locator("text='Reports'").click()
        await page.locator("text='Registrar'").click()
        await page.locator("text='Grades'").click()
        await page.locator("text='Individual Term Grades (Match Curriculum)'").click()
        await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit 
        
        await page.locator(`:text("Student") + div`).locator('> input').fill(ID)
        await page.locator(`:text("Period") + div`).locator('> input').fill(SEM)
        await page.locator(`:text("Level") + div`).click()
        await page.locator("text='College'").click()
        await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit 

        await page.locator("text='Refresh'").click()

        const downloadPromise = page.waitForEvent('download')
        await new Promise(resolve => setTimeout(resolve, 2000)) // Rate limit 
        await page.locator("text='XLS'").click()
        const download = await downloadPromise;
        await download.saveAs(filePath)
        await browser.close();
        if (CONSOLE) console.log(`Grades downloaded and saved to file ${filePath}`)
        return filePath

    } catch (error) {
        if (browser) {
            await browser.close();
        }
        throw error
    }
}