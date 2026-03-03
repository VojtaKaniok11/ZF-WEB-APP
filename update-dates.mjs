import sql from 'mssql/msnodesqlv8.js';
const pool = await new sql.ConnectionPool({ server: 'VojtaKaniok\\SQLTESTOVACI', database: 'HR', driver: 'ODBC Driver 17 for SQL Server', options: { trustedConnection: true } }).connect();

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function run() {
    try {
        console.log("Updating dates to recent values...");

        // 1. Lékařské prohlídky
        const medReq = await pool.request().query("SELECT ID, ExamTypeID FROM dbo.MEDICAL_EXAM_RECORDS");
        const medTypesReq = await pool.request().query("SELECT ID, ValidityMonths FROM dbo.MEDICAL_EXAM_TYPES");
        const medTypesDict = {};
        medTypesReq.recordset.forEach(m => medTypesDict[m.ID] = m.ValidityMonths || 12);

        for (const row of medReq.recordset) {
            // Zamícháme to tak, aby 70% bylo platných (datum vystavení od začátku 2025 dál) a 30% starých
            const isRecent = Math.random() > 0.3;
            let date;
            if (isRecent) {
                date = randomDate(new Date(2025, 0, 1), new Date());
            } else {
                date = randomDate(new Date(2023, 0, 1), new Date(2024, 6, 1));
            }

            const expiry = new Date(date);
            expiry.setMonth(expiry.getMonth() + (medTypesDict[row.ExamTypeID] || 12));

            await pool.request().query(`
                UPDATE dbo.MEDICAL_EXAM_RECORDS 
                SET ExamDate = '${date.toISOString()}', NextExamDate = '${expiry.toISOString()}'
                WHERE ID = '${row.ID}'
            `);
        }

        // 2. OOPP
        const ooppReq = await pool.request().query("SELECT ID FROM dbo.OOPP_ISSUES");
        for (const row of ooppReq.recordset) {
            const isRecent = Math.random() > 0.3;
            let date;
            if (isRecent) {
                date = randomDate(new Date(2025, 0, 1), new Date());
            } else {
                date = randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1));
            }
            const expiry = new Date(date);
            expiry.setMonth(expiry.getMonth() + 24); // OOPP většinou na 2 roky

            await pool.request().query(`
                UPDATE dbo.OOPP_ISSUES 
                SET IssueDate = '${date.toISOString()}', NextEntitlementDate = '${expiry.toISOString()}'
                WHERE ID = '${row.ID}'
            `);
        }

        // 3. ILUO
        const iluoReq = await pool.request().query("SELECT ID FROM dbo.ILUO_ASSESSMENTS");
        for (const row of iluoReq.recordset) {
            const date = randomDate(new Date(2025, 0, 1), new Date());
            await pool.request().query(`
                UPDATE dbo.ILUO_ASSESSMENTS 
                SET AssessmentDate = '${date.toISOString()}'
                WHERE ID = '${row.ID}'
            `);
        }

        // 4. Školení. Školení berou datum z TRAINING_SESSIONS (SessionDate). Můžeme je náhodně posunout.
        const sessionReq = await pool.request().query("SELECT ID FROM dbo.TRAINING_SESSIONS");
        for (const row of sessionReq.recordset) {
            const isRecent = Math.random() > 0.3;
            let date;
            if (isRecent) {
                date = randomDate(new Date(2025, 0, 1), new Date());
            } else {
                date = randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1));
            }
            await pool.request().query(`
                UPDATE dbo.TRAINING_SESSIONS 
                SET SessionDate = '${date.toISOString()}'
                WHERE ID = '${row.ID}'
            `);
        }

        console.log("Hotovo! Zhruba 70% dat je nyní plně aktivních a asi 30% starších. Refreshni stránku.");
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
run();
