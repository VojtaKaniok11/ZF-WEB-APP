import sql from 'mssql/msnodesqlv8.js';
import fs from 'fs';
const pool = await new sql.ConnectionPool({ server: 'VojtaKaniok\\SQLTESTOVACI', database: 'HR', driver: 'ODBC Driver 17 for SQL Server', options: { trustedConnection: true } }).connect();

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function run() {
    try {
        console.log("Loading metadata...");
        const employeesReq = await pool.request().query("SELECT PersonalNumber FROM dbo.EMPLOYEES");
        const employees = employeesReq.recordset.map(e => e.PersonalNumber);

        // Fetch valid IDs from related tables
        const sessionsReq = await pool.request().query("SELECT ID FROM dbo.TRAINING_SESSIONS");
        const sessionIds = sessionsReq.recordset.map(s => s.ID);

        const medTypesReq = await pool.request().query("SELECT ID, ValidityMonths FROM dbo.MEDICAL_EXAM_TYPES");
        const medTypes = medTypesReq.recordset;

        const skillsReq = await pool.request().query("SELECT ID FROM dbo.ILUO_SKILLS");
        const skillIds = skillsReq.recordset.map(s => s.ID);

        const ooppItemsReq = await pool.request().query("SELECT ID FROM dbo.OOPP_ITEMS");
        const ooppItems = ooppItemsReq.recordset;

        let trnInserted = 0, medInserted = 0, iluoInserted = 0, ooppInserted = 0;
        let errs = [];

        for (const pn of employees) {
            if (!pn) continue;

            // 1. Školení (TRAINING_ATTENDEES)
            const numTrainings = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numTrainings; i++) {
                if (sessionIds.length > 0) {
                    const sId = sessionIds[Math.floor(Math.random() * sessionIds.length)];
                    try {
                        const exists = await pool.request().query(`SELECT 1 FROM dbo.TRAINING_ATTENDEES WHERE SessionID = '${sId}' AND PersonalNumber = '${pn}'`);
                        if (exists.recordset.length === 0) {
                            await pool.request().query(`
                                INSERT INTO dbo.TRAINING_ATTENDEES (SessionID, PersonalNumber, Status)
                                VALUES ('${sId}', '${pn}', 'Absolvoval')
                            `);
                            trnInserted++;
                        }
                    } catch (e) { errs.push('TRN: ' + e.message); }
                }
            }

            // 2. Lékařské (MEDICAL_EXAM_RECORDS)
            const numMeds = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numMeds; i++) {
                if (medTypes.length > 0) {
                    const mType = medTypes[Math.floor(Math.random() * medTypes.length)];
                    const date = randomDate(new Date(2023, 0, 1), new Date());
                    const expiry = new Date(date);
                    expiry.setMonth(expiry.getMonth() + (mType.ValidityMonths || 12));
                    try {
                        const exists = await pool.request().query(`SELECT 1 FROM dbo.MEDICAL_EXAM_RECORDS WHERE ExamTypeID = '${mType.ID}' AND EmployeePersonalNumber = '${pn}'`);
                        if (exists.recordset.length === 0) {
                            const newId = 'MEXR-' + Math.floor(Math.random() * 1000000);
                            await pool.request().query(`
                                INSERT INTO dbo.MEDICAL_EXAM_RECORDS (ID, EmployeePersonalNumber, ExamTypeID, ExamDate, NextExamDate, DoctorName, Result)
                                VALUES ('${newId}', '${pn}', '${mType.ID}', '${date.toISOString()}', '${expiry.toISOString()}', 'MUDr. Novotný', 'Způsobilý')
                            `);
                            medInserted++;
                        }
                    } catch (e) { errs.push('MED: ' + e.message); }
                }
            }

            // 3. ILUO (ILUO_ASSESSMENTS)
            const numIluo = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numIluo; i++) {
                if (skillIds.length > 0) {
                    const skId = skillIds[Math.floor(Math.random() * skillIds.length)];
                    const levels = ['I', 'L', 'U', 'O'];
                    const lvl = levels[Math.floor(Math.random() * levels.length)];
                    const date = randomDate(new Date(2023, 0, 1), new Date());
                    try {
                        const exists = await pool.request().query(`SELECT 1 FROM dbo.ILUO_ASSESSMENTS WHERE SkillID = '${skId}' AND EmployeePersonalNumber = '${pn}'`);
                        if (exists.recordset.length === 0) {
                            const newId = 'ASSESS-' + Math.floor(Math.random() * 1000000);
                            await pool.request().query(`
                                INSERT INTO dbo.ILUO_ASSESSMENTS (ID, EmployeePersonalNumber, SkillID, [Level], TargetLevel, AssessmentDate, AssessorName)
                                VALUES ('${newId}', '${pn}', '${skId}', '${lvl}', 'O', '${date.toISOString()}', 'Vedoucí')
                            `);
                            iluoInserted++;
                        }
                    } catch (e) { errs.push('ILUO: ' + e.message); }
                }
            }

            // 4. OOPP (OOPP_ISSUES)
            const numOopp = Math.floor(Math.random() * 4) + 1;
            for (let i = 0; i < numOopp; i++) {
                if (ooppItems.length > 0) {
                    const oItem = ooppItems[Math.floor(Math.random() * ooppItems.length)];
                    const date = randomDate(new Date(2023, 0, 1), new Date());
                    const expiry = new Date(date);
                    expiry.setMonth(expiry.getMonth() + 24);
                    try {
                        const exists = await pool.request().query(`SELECT 1 FROM dbo.OOPP_ISSUES WHERE OoppItemID = '${oItem.ID}' AND EmployeePersonalNumber = '${pn}'`);
                        if (exists.recordset.length === 0) {
                            const newId = 'ISS-' + Math.floor(Math.random() * 1000000);
                            await pool.request().query(`
                                INSERT INTO dbo.OOPP_ISSUES (ID, EmployeePersonalNumber, OoppItemID, IssueDate, NextEntitlementDate, Quantity)
                                VALUES ('${newId}', '${pn}', '${oItem.ID}', '${date.toISOString()}', '${expiry.toISOString()}', 1)
                            `);
                            ooppInserted++;
                        }
                    } catch (e) { errs.push('OOPP: ' + e.message); }
                }
            }
        }

        console.log(`Inserted: ${trnInserted} Trainings | ${medInserted} Medicals | ${iluoInserted} ILUO | ${ooppInserted} OOPP`);
        if (errs.length > 0) {
            fs.writeFileSync('errors.json', JSON.stringify([...new Set(errs)], null, 2));
            console.error("Errors encountered: Check errors.json");
        }
        process.exit(0);

    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
}
run();
