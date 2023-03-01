/**
 * Usage
 * 
 *  node oto/gen-promo-list [username] [admin password] [college] [sem] [course] [year]
 * 
 * Examples:
 *  
 * node oto/gen-promo-list USERNAME PASSWORD CEIT 22-1 BITAT 1
 * 
 */
const fs = require('fs')
const path = require('path')
const process = require('process')
const ExcelJS = require('exceljs')
const getGrades = require('./get-grades')
const getEnrollmentList = require('./get-enrollment-list')
const toWorkSheet = async (file, sheetName = 'Sheet1') => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file)
    return workbook.getWorksheet(sheetName)
}
global.DIR = path.resolve(__dirname).replace(/\\/g, '/'); // Turn back slash to slash for cross-platform compat

    ;
(async () => {
    try {
        const args = process.argv.slice(2);
        const USERNAME = args[0]
        const PASSWORD = args[1]
        const COLLEGE = args[2]
        const SEM = args[3]
        const COURSE = args[4]
        const YEAR = args[5]


        const TARGET_DIR = path.join(DIR, `promotional-lists`)
        const URL = `http://203.177.71.162/sias/`

        if (!fs.existsSync(TARGET_DIR)) {
            fs.mkdirSync(TARGET_DIR, { recursive: true })
        }

        const timeFmt = {
            timeZone: 'Asia/Manila',
            hour: 'numeric',
            minute: '2-digit',
            second: 'numeric',
        }
        console.log(`Started ${(new Date()).toLocaleTimeString('fil-PH', timeFmt)}`)
        
        // LOAD MASTERLIST AND DOWNLOAD GRADES PER SEM
        const worksheet = await getEnrollmentList([USERNAME, PASSWORD, COLLEGE, SEM, COURSE, YEAR, URL, TARGET_DIR])
        let rowCount = 0
        let gradeFiles = []
        let gradeStudents = []
        // Loop thru each student
        const START_ROW = 8
        for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber)
            if (rowNumber >= START_ROW) {
                rowCount++
                let ROW = (new String(row.getCell(1).text)).trim()
                let ID = (new String(row.getCell(2).text)).trim()
                let NAME = (new String(row.getCell(3).text)).trim()
                let GENDER = (new String(row.getCell(4).text)).trim()
                let COURSE = (new String(row.getCell(5).text)).trim()
                let YEAR = (new String(row.getCell(6).text)).trim()
                let UNIT = (new String(row.getCell(7).text)).trim()
                let SECTION = (new String(row.getCell(8).text)).trim()
                let ADDRESS = (new String(row.getCell(11).text)).trim()

                let lastName = ''
                let firstName = ''
                let middleName = ''

                try {
                    let names = NAME.split(',')
                    lastName = names[0]
                    firstName = names[1].substr(0, names[1].length - 2)
                    middleName = names[1].slice(-2)
                } catch (err) {
                    console.error(`Error on row ${rowCount} could not split the name ${NAME} into last, first, and middle name.`)
                    lastName = NAME
                }

                try {
                    let filePath = await getGrades([USERNAME, PASSWORD, ID, SEM, URL, TARGET_DIR, false])
                    
                    console.log(`${rowCount} of ${worksheet.rowCount - START_ROW + 1} to ${filePath}`)
                    gradeFiles.push(filePath)
                    gradeStudents.push({
                        rowNumber: ROW,
                        id: ID,
                        lastName: lastName,
                        firstName: firstName,
                        middleName: middleName,
                        gender: GENDER,
                    })
                } catch (err) {
                    gradeFiles.push(``)
                    gradeStudents.push(null)
                    // console.log(`${rowCount} FAILED ${filePath}`)
                    console.error(err)
                }
            }
        }

        // Generate output
        const workbookOut = new ExcelJS.Workbook();
        await workbookOut.xlsx.readFile(`${DIR}/template.xlsx`)
        const worksheetOut = workbookOut.getWorksheet('Sheet1')

        let yearLevel = '1st Year'
        if (YEAR == 2) {
            yearLevel = '2nd Year'
        } else if (YEAR == 3) {
            yearLevel = '3rd Year'
        } else if (YEAR == 4) {
            yearLevel = '4th Year'
        }
        let activeRowNumber = 13
        worksheetOut.getRow(activeRowNumber).getCell(1).value = yearLevel
        worksheetOut.getRow(activeRowNumber).getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'ffff00' }
        }
        worksheetOut.mergeCells(`A${activeRowNumber}:J${activeRowNumber}`);

        // Loop on grade files
        for (let index = 0; index < gradeFiles.length; index++) {
            const rowCount = index + 1
            const filePath = gradeFiles[index]
            // console.log(`${rowCount} to ${filePath}`)
            const worksheetSrc = await toWorkSheet(filePath)
            // console.log(gradeFiles)


            activeRowNumber++
            worksheetOut.getRow(activeRowNumber).getCell(1).value = gradeStudents[index].rowNumber
            worksheetOut.getRow(activeRowNumber).getCell(2).value = gradeStudents[index].id
            worksheetOut.getRow(activeRowNumber).getCell(3).value = gradeStudents[index].lastName
            worksheetOut.getRow(activeRowNumber).getCell(4).value = gradeStudents[index].firstName
            worksheetOut.getRow(activeRowNumber).getCell(5).value = gradeStudents[index].middleName
            worksheetOut.getRow(activeRowNumber).getCell(6).value = gradeStudents[index].gender

            let startRow = activeRowNumber
            let totalUnits = 0
            for (let rowNumber = 1; rowNumber <= worksheetSrc.rowCount; rowNumber++) {

                const row = worksheetSrc.getRow(rowNumber)
                if (rowNumber >= 9) {
                    let CODE = (new String(row.getCell(1).text)).trim()
                    let SUBJECT = (new String(row.getCell(2).text)).trim()
                    let GRADE1 = (new String(row.getCell(7).text)).trim()
                    let GRADE2 = (new String(row.getCell(8).text)).trim()
                    let UNIT = parseFloat((new String(row.getCell(9).text)).trim())
                    totalUnits += UNIT
                    let grade = (GRADE2) ? GRADE2 : GRADE1
                    if (GRADE2 === 'P') grade = GRADE1
                    if (!grade) {
                        grade = 'INC'
                    }
                    if (!isNaN(grade)) {
                        grade = parseFloat(grade)
                    }
                    worksheetOut.getRow(activeRowNumber).getCell(7).value = CODE
                    worksheetOut.getRow(activeRowNumber).getCell(8).value = SUBJECT
                    worksheetOut.getRow(activeRowNumber).getCell(9).value = grade
                    worksheetOut.getRow(activeRowNumber).getCell(10).value = UNIT
                    activeRowNumber++
                }
            }
            let endRow = activeRowNumber - 1

            worksheetOut.getRow(activeRowNumber).getCell(8).value = `TOTAL UNITS`
            worksheetOut.getRow(activeRowNumber).getCell(10).value = {
                formula: `=SUM(J${startRow}:J${endRow})`,
                result: totalUnits
            }
            activeRowNumber++

        }

        //TODO: 1-4th year
        await workbookOut.xlsx.writeFile(`${TARGET_DIR}/promo-list-${COLLEGE}-${SEM}-${COURSE}-${YEAR}.xlsx`);
        console.log(`Done. See ${TARGET_DIR}/promo-list-${COLLEGE}-${SEM}-${COURSE}-${YEAR}.xlsx`)
        console.log(`Ended ${(new Date()).toLocaleTimeString('fil-PH', timeFmt)}`)
    } catch (error) {
        console.error(error)
    }
})();