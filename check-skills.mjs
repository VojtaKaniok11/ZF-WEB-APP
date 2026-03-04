import sql from 'mssql/msnodesqlv8.js';
const pool = await new sql.ConnectionPool({ server: 'VojtaKaniok\\SQLTESTOVACI', database: 'HR', driver: 'ODBC Driver 17 for SQL Server', options: { trustedConnection: true } }).connect();

async function run() {
    let res = await pool.request().query("SELECT TOP 1 * FROM dbo.ILUO_SKILLS");
    console.log(Object.keys(res.recordset[0] || {}));
    process.exit(0);
}
run();
