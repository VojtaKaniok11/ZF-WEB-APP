import sql from 'mssql/msnodesqlv8.js';
const pool = await new sql.ConnectionPool({ server: 'VojtaKaniok\\SQLTESTOVACI', database: 'HR', driver: 'ODBC Driver 17 for SQL Server', options: { trustedConnection: true } }).connect();

async function run() {
    // Get all employees
    const emps = await pool.request().query("SELECT ID, PersonalNumber, FirstName, LastName FROM dbo.EMPLOYEES ORDER BY PersonalNumber");
    console.log(`Total employees: ${emps.recordset.length}`);
    console.log(emps.recordset.map(e => `${e.PersonalNumber} - ${e.FirstName} ${e.LastName}`).join('\n'));

    // Check training tables
    const trn = await pool.request().query("SELECT COUNT(*) as c FROM dbo.TRAININGS");
    const trnSessions = await pool.request().query("SELECT COUNT(*) as c FROM dbo.TRAINING_SESSIONS");
    const trnAttendees = await pool.request().query("SELECT COUNT(*) as c FROM dbo.TRAINING_ATTENDEES");
    console.log(`\nTRAININGS: ${trn.recordset[0].c}, SESSIONS: ${trnSessions.recordset[0].c}, ATTENDEES: ${trnAttendees.recordset[0].c}`);

    const trnList = await pool.request().query("SELECT ID, Name FROM dbo.TRAININGS");
    console.log('Trainings:', trnList.recordset.map(t => `${t.ID}: ${t.Name}`).join(', '));

    // Check medical tables
    const med = await pool.request().query("SELECT COUNT(*) as c FROM dbo.MEDICAL_EXAM_TYPES");
    const medRec = await pool.request().query("SELECT COUNT(*) as c FROM dbo.MEDICAL_EXAM_RECORDS");
    console.log(`\nMEDICAL_EXAM_TYPES: ${med.recordset[0].c}, RECORDS: ${medRec.recordset[0].c}`);
    const medList = await pool.request().query("SELECT ID, Name FROM dbo.MEDICAL_EXAM_TYPES");
    console.log('Med types:', medList.recordset.map(m => `${m.ID}: ${m.Name}`).join(', '));

    // Check ILUO tables
    const iluo = await pool.request().query("SELECT COUNT(*) as c FROM dbo.ILUO_SKILLS");
    const iluoAss = await pool.request().query("SELECT COUNT(*) as c FROM dbo.ILUO_ASSESSMENTS");
    console.log(`\nILUO_SKILLS: ${iluo.recordset[0].c}, ASSESSMENTS: ${iluoAss.recordset[0].c}`);
    const iluoList = await pool.request().query("SELECT ID, Name FROM dbo.ILUO_SKILLS");
    console.log('ILUO skills:', iluoList.recordset.map(s => `${s.ID}: ${s.Name}`).join(', '));

    // Check OOPP tables
    const oopp = await pool.request().query("SELECT COUNT(*) as c FROM dbo.OOPP_ITEMS");
    const ooppIss = await pool.request().query("SELECT COUNT(*) as c FROM dbo.OOPP_ISSUES");
    console.log(`\nOOPP_ITEMS: ${oopp.recordset[0].c}, ISSUES: ${ooppIss.recordset[0].c}`);
    const ooppList = await pool.request().query("SELECT ID, Name FROM dbo.OOPP_ITEMS");
    console.log('OOPP items:', ooppList.recordset.map(o => `${o.ID}: ${o.Name}`).join(', '));

    process.exit(0);
}
run();
