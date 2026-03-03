import sql from 'mssql/msnodesqlv8.js';
const pool = await new sql.ConnectionPool({ server: 'VojtaKaniok\\SQLTESTOVACI', database: 'HR', driver: 'ODBC Driver 17 for SQL Server', options: { trustedConnection: true } }).connect();

async function run() {
    console.log('--- TABLE COUNTS ---')
    let res = await pool.request().query('SELECT COUNT(*) as c FROM dbo.TRAINING_ATTENDEES');
    console.log('TRAININGS:', res.recordset[0].c);

    res = await pool.request().query('SELECT COUNT(*) as c FROM dbo.MEDICAL_EXAM_RECORDS');
    console.log('MEDICAL:', res.recordset[0].c);

    res = await pool.request().query('SELECT COUNT(*) as c FROM dbo.ILUO_ASSESSMENTS');
    console.log('ILUO:', res.recordset[0].c);

    res = await pool.request().query('SELECT COUNT(*) as c FROM dbo.OOPP_ISSUES');
    console.log('OOPP:', res.recordset[0].c);

    console.log('\n--- TRAINING CHECK FOR TEST003 ---');
    res = await pool.request().query(`
        SELECT tp.PersonalNumber, t.Name, ts.SessionDate
        FROM dbo.TRAINING_ATTENDEES tp
        JOIN dbo.TRAINING_SESSIONS ts ON ts.ID = tp.SessionID
        JOIN dbo.TRAININGS t ON t.ID = ts.TrainingID
        WHERE tp.PersonalNumber = 'TEST003'
    `);
    console.log('Records for TEST003:', res.recordset);
    process.exit(0);
}

run();
