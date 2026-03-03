import sql from 'mssql/msnodesqlv8.js';
const pool = await new sql.ConnectionPool({ server: 'VojtaKaniok\\SQLTESTOVACI', database: 'HR', driver: 'ODBC Driver 17 for SQL Server', options: { trustedConnection: true } }).connect();

async function run() {
    // Add ManagerName text column if it doesn't exist yet
    await pool.request().query(`
        IF NOT EXISTS (
            SELECT 1 FROM sys.columns
            WHERE object_id = OBJECT_ID('dbo.EMPLOYEES') AND name = 'ManagerName'
        )
        ALTER TABLE dbo.EMPLOYEES ADD ManagerName NVARCHAR(150) NULL
    `);
    console.log('ManagerName column ensured.');

    // Drop Mobile column if it exists
    await pool.request().query(`
        IF EXISTS (
            SELECT 1 FROM sys.columns
            WHERE object_id = OBJECT_ID('dbo.EMPLOYEES') AND name = 'Mobile'
        )
        ALTER TABLE dbo.EMPLOYEES DROP COLUMN Mobile
    `);
    console.log('Mobile column removed (if existed).');

    let res = await pool.request().query("SELECT TOP 1 * FROM dbo.EMPLOYEES");
    console.log('Current columns:', Object.keys(res.recordset[0]));
    process.exit(0);
}
run();

