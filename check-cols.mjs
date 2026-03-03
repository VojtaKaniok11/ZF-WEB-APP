import sql from 'mssql/msnodesqlv8.js';
const pool = await new sql.ConnectionPool({ server: 'VojtaKaniok\\SQLTESTOVACI', database: 'HR', driver: 'ODBC Driver 17 for SQL Server', options: { trustedConnection: true } }).connect();

async function run() {
    for (const table of ['TRAINING_ATTENDEES', 'MEDICAL_EXAM_RECORDS', 'ILUO_ASSESSMENTS', 'OOPP_ISSUES']) {
        const r = await pool.request().query(`SELECT TOP 1 * FROM dbo.${table}`);
        console.log(table, Object.keys(r.recordset[0] || {}));
    }
    process.exit(0);
}
run();
