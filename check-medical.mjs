import sql from 'mssql/msnodesqlv8.js';
import fs from 'fs';
const pool = await new sql.ConnectionPool({ server: 'VojtaKaniok\\SQLTESTOVACI', database: 'HR', driver: 'ODBC Driver 17 for SQL Server', options: { trustedConnection: true } }).connect();

async function run() {
    let res = await pool.request().query("SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='MEDICAL_EXAM_TYPES'");
    fs.writeFileSync('medical_types_cols.json', JSON.stringify(res.recordset, null, 2));
    process.exit(0);
}
run();
