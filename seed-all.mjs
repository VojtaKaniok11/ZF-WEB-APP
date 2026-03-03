import sql from 'mssql/msnodesqlv8.js';
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

        console.log(`Found ${employees.length} employees. Generating data...`);

        let trnInserted = 0;
        let medInserted = 0;
        let iluoInserted = 0;
        let ooppInserted = 0;

        for (const pn of employees) {
            if (!pn) continue;

            const req = pool.request();
            // --- 1. Školení (TRAINING_ATTENDEES) ---
            // Každému přidáme náhodně 1-3 školení, ale jen pokud už ho nemá
            const numTrainings = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numTrainings; i++) {
                if (sessionIds.length > 0) {
                    const sId = sessionIds[Math.floor(Math.random() * sessionIds.length)];
                    try {
                        await pool.request().query(`
                            IF NOT EXISTS (SELECT 1 FROM dbo.TRAINING_ATTENDEES WHERE SessionID = ${sId} AND PersonalNumber = '${pn}')
                            BEGIN
                                INSERT INTO dbo.TRAINING_ATTENDEES (SessionID, PersonalNumber, CreatedAt, UpdatedAt)
                                VALUES (${sId}, '${pn}', SYSDATETIME(), SYSDATETIME())
                            END
                        `);
                        trnInserted++;
                    } catch (e) { console.error("TRN Error", e); }
                }
            }

            // --- 2. Lékařské (MEDICAL_EXAM_RECORDS) ---
            const numMeds = Math.floor(Math.random() * 2) + 1; // 1-2
            for (let i = 0; i < numMeds; i++) {
                if (medTypes.length > 0) {
                    const mType = medTypes[Math.floor(Math.random() * medTypes.length)];
                    const date = randomDate(new Date(2023, 0, 1), new Date());
                    const expiry = new Date(date);
                    expiry.setMonth(expiry.getMonth() + (mType.ValidityMonths || 12));
                    try {
                        await pool.request().query(`
                            IF NOT EXISTS (SELECT 1 FROM dbo.MEDICAL_EXAM_RECORDS WHERE ExamTypeID = ${mType.ID} AND PersonalNumber = '${pn}')
                            BEGIN
                                INSERT INTO dbo.MEDICAL_EXAM_RECORDS (PersonalNumber, ExamTypeID, ExamDate, ExpirationDate, Clinic, Doctor, Result, CreatedAt, UpdatedAt)
                                VALUES ('${pn}', ${mType.ID}, '${date.toISOString()}', '${expiry.toISOString()}', 'Poliklinika', 'MUDr. Novotný', 'Způsobilý', SYSDATETIME(), SYSDATETIME())
                            END
                        `);
                        medInserted++;
                    } catch (e) { console.error("MED Error", e); }
                }
            }

            // --- 3. ILUO (ILUO_ASSESSMENTS) ---
            const numIluo = Math.floor(Math.random() * 3) + 1; // 1-3
            for (let i = 0; i < numIluo; i++) {
                if (skillIds.length > 0) {
                    const skId = skillIds[Math.floor(Math.random() * skillIds.length)];
                    const levels = ['I', 'L', 'U', 'O'];
                    const lvl = levels[Math.floor(Math.random() * levels.length)];
                    try {
                        await pool.request().query(`
                            IF NOT EXISTS (SELECT 1 FROM dbo.ILUO_ASSESSMENTS WHERE SkillID = ${skId} AND PersonalNumber = '${pn}')
                            BEGIN
                                INSERT INTO dbo.ILUO_ASSESSMENTS (PersonalNumber, SkillID, CurrentLevel, AssessedBy, AssessedDate, CreatedAt, UpdatedAt)
                                VALUES ('${pn}', ${skId}, '${lvl}', 'Vedoucí', SYSDATETIME(), SYSDATETIME(), SYSDATETIME())
                            END
                        `);
                        iluoInserted++;
                    } catch (e) { console.error("ILUO Error", e); }
                }
            }

            // --- 4. OOPP (OOPP_ISSUES) ---
            const numOopp = Math.floor(Math.random() * 4) + 1; // 1-4
            for (let i = 0; i < numOopp; i++) {
                if (ooppItems.length > 0) {
                    const oItem = ooppItems[Math.floor(Math.random() * ooppItems.length)];
                    const date = randomDate(new Date(2023, 0, 1), new Date());
                    const expiry = new Date(date);
                    expiry.setMonth(expiry.getMonth() + 24);
                    try {
                        await pool.request().query(`
                            IF NOT EXISTS (SELECT 1 FROM dbo.OOPP_ISSUES WHERE ItemID = ${oItem.ID} AND PersonalNumber = '${pn}')
                            BEGIN
                                INSERT INTO dbo.OOPP_ISSUES (PersonalNumber, ItemID, IssueDate, ExpectedReplacementDate, Quantity, IssuedBy, CreatedAt, UpdatedAt)
                                VALUES ('${pn}', ${oItem.ID}, '${date.toISOString()}', '${expiry.toISOString()}', 1, 'Sklad', SYSDATETIME(), SYSDATETIME())
                            END
                        `);
                        ooppInserted++;
                    } catch (e) { console.error("OOPP Error", e); }
                }
            }
        }

        console.log("Seeding complete!");
        console.log(`Inserted: ${trnInserted} Trainings | ${medInserted} Medicals | ${iluoInserted} ILUO | ${ooppInserted} OOPP`);
        process.exit(0);

    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
}

run();
