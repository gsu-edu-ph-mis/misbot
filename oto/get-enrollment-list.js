/**
 * Usage
 * 
 *  node sias-term-grades [username] [admin password]
 * 
 *  node sias-term-grades USERNAME PASSWORD 2020-1-0649 22-1
 * 
 */
const ExcelJS = require('exceljs')
const fs = require('fs')
const { chromium } = require('playwright')  // Or 'chromium' or 'webkit'.
const toWorkSheet = async (file, sheetName = 'Sheet1') => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file)
    return workbook.getWorksheet(sheetName)
}

// Return ExcelJS worksheet or throw an error
module.exports = async (args) => {
    let browser = null
    try {
        const USERNAME = args[0]
        const PASSWORD = args[1]
        const COLLEGE = args[2]
        const SEM = args[3]
        const COURSE = args[4]
        const YEAR = args[5]
        const URL = args[6]
        const DIR = args[7]

        const MASTER_LIST = `${DIR}/enrollment-list-${COLLEGE}-${SEM}-${COURSE}-${YEAR}.xlsx`
        if (fs.existsSync(MASTER_LIST)) {
            console.log(`Load master list from file ${MASTER_LIST}`)
            const workSheet = await toWorkSheet(MASTER_LIST)
            return workSheet
        }
        console.log(`Download master list from network`)

        browser = await chromium.launch({
            headless: false,
            // devtools: true,
        })
        const page = await browser.newPage()
        await page.goto(URL, {
            waitUntil: 'networkidle',
        })

        await page.locator("text='Administrator'").click()
        await page.locator(`input[type="password"]`).nth(0).type(USERNAME)
        await page.locator(`input[type="password"]`).nth(1).type(PASSWORD)
        await page.locator("text='Login'").click()

        await page.locator("text='Reports'").click()
        await page.locator("text='Registrar'").click()
        await page.locator("text='Enrollment List'").click()
        await page.locator(`body > div:nth-child(3) > div:nth-child(1) > div:nth-child(3) > div.qx-main > div > div > div > div > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(6) > input`).type(COLLEGE)
        await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit 

        await page.locator(`:text("Level") + div`).click()
        await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit 

        await page.locator("text='College'").click()
        await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit 

        await page.locator(`body > div:nth-child(3) > div:nth-child(1) > div:nth-child(3) > div.qx-main > div > div > div > div > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > input`).fill(SEM)
        await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit 

        await page.locator(`body > div:nth-child(3) > div:nth-child(1) > div:nth-child(3) > div.qx-main > div > div > div > div > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(8) > input`).fill(COURSE)
        await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit 

        await page.locator(`body > div:nth-child(3) > div:nth-child(1) > div:nth-child(3) > div.qx-main > div > div > div > div > div > div:nth-child(1) > div:nth-child(1) > input`).fill(YEAR)
        await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit 

        await page.locator("text='Refresh'").nth(1).click()
        await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit 

        const downloadPromise = page.waitForEvent('download')
        await new Promise(resolve => setTimeout(resolve, 2000)) // Rate limit 
        await page.locator("text='XLS'").click()
        const download = await downloadPromise;
        await download.saveAs(MASTER_LIST)
        await browser.close();

        console.log(`Master list downloaded to file ${MASTER_LIST}`)
        const workSheet = await toWorkSheet(MASTER_LIST)
        return workSheet

    } catch (error) {
        if (browser) {
            await browser.close();
        }
        throw error
    }
}