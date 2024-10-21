/**
 * Usage
 *  node script-schedule gsu. xxx https://hris.gsu.edu.ph https://icto.gsu.edu.ph
 * 
 */
const process = require('process')
const axios = require('axios')
const lodash = require('lodash')
const { chromium } = require('playwright')  // Or 'chromium' or 'webkit'.
const fs = require('fs')


    ;
(async () => {
    try {
        const PID = 11

        let masterlist = fs.readFileSync('./masterlist.txt', { encoding: 'utf-8' })
        masterlist = masterlist.replace(/(\s)+/, ' ')
        masterlist = masterlist.split(/\r\n/)
        masterlist = masterlist.map(l => {
            return l.split(/ [A-Za-z]\. /).map(o => lodash.trim(o))
        })
        const browser = await chromium.launch({ headless: false, devtools: false });
        const page = await browser.newPage();
        const args = process.argv.slice(2);
        await page.goto(`${args[2]}`, {
            waitUntil: 'networkidle'
        });

        await page.getByPlaceholder('Username').fill(`${args[0]}`)
        await page.getByPlaceholder('Password').fill(`${args[1]}`)
        await page.keyboard.press('Enter');
        await page.waitForSelector('h1:text("Employees")')

        for (m = 0; m < masterlist.length; m++) {
            let list = masterlist[m]

            await page.goto(`${args[2]}/schedule/create`);
            let queries = `&first_name=${list[0]}`
            if (list[0] && list[1]) {
                queries = `&first_name=${list[0]}&last_name=${list[1]}`
            }

            let URL = `${args[3]}/search/search10.php?p_id=${PID}${queries}`
            let response = await axios.get(URL)
            console.log(URL)
            let name = response.data.name
            let weekDays = response.data.weekDays
            let period = response.data.period
            await page.locator('#workScheduleName').fill(`${period} ${name} Part-time`)

            let keys = Object.keys(weekDays)
            for (let x = 0; x < keys.length; x++) {
                let key = keys[x]
                let weekDay = weekDays[key]
                let keyF = ''
                if (key === 'M') {
                    keyF = 'mon'
                } else if (key === 'T') {
                    keyF = 'tue'
                } else if (key === 'W') {
                    keyF = 'wed'
                } else if (key === 'Th') {
                    keyF = 'thu'
                } else if (key === 'F') {
                    keyF = 'fri'
                } else if (key === 'S') {
                    keyF = 'sat'
                } else if (key === 'Su') {
                    keyF = 'sun'
                }
                console.log('seg#', keyF)


                for (let y = 0; y < weekDay.length; y++) {
                    console.log(y)
                    await page.locator(`#addSegment${keyF}`).click()
                    await page.getByLabel('Start Time *').fill(weekDay[y][2])
                    await page.getByLabel('End Time *').fill(weekDay[y][3])
                    await page.locator('button.btn:text("Add Time Segment")').click()
                }
                for (let y = 0; y < weekDay.length; y++) {

                    if (lodash.get(weekDay, `[${y}][5].length`, 0) > 0) {
                        for (let b = 0; b < weekDay[y][5].length; b++) {
                            console.log('break#', b)
                            await page.locator('#' + keyF + '-' + y).click()
                            await page.locator('button.btn:text("Add Breaks")').click()
                            await page.locator('#breakStart' + b).fill(weekDay[y][5][b][2])
                            await page.locator('#breakEnd' + b).fill(weekDay[y][5][b][3])
                            await page.locator('button.btn:text("Update")').click()
                        }
                    }
                }

            }

            await page.locator('button.btn:text("Save Schedule")').click()
            // 

        }
        await browser.close();
        // console.log(response.data)
    } catch (error) {
        console.error(error)
    }
})();