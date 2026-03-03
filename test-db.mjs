import sql from 'mssql/msnodesqlv8.js';

const config = {
    server: 'VojtaKaniok\\SQLTESTOVACI',
    database: 'HR',
    driver: 'ODBC Driver 17 for SQL Server',
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function test() {
    try {
        console.log('Connecting to:', config.server, ':', config.port, '/', config.database);
        const pool = await new sql.ConnectionPool(config).connect();
        console.log('✅ Connected successfully!');

        const result = await pool.request().query('SELECT TOP 5 * FROM dbo.EMPLOYEES');
        console.log('Total rows in HR.dbo.EMPLOYEES:', result.recordset.length);
        console.log('Sample row:', JSON.stringify(result.recordset[0], null, 2));
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

test();
