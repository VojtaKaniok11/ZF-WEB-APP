import sql from "mssql/msnodesqlv8";

const baseOptions: sql.config["options"] = {
    trustedConnection: true,   // Windows Authentication (Integrated Security)
    trustServerCertificate: true,
    enableArithAbort: true,
};

const hrConfig: sql.config = {
    server: "VojtaKaniok\\SQLTESTOVACI",
    database: "HR",
    driver: "ODBC Driver 17 for SQL Server",
    options: baseOptions,
};

const userMgmtConfig: sql.config = {
    server: "VojtaKaniok\\SQLTESTOVACI",
    database: "USER_MANAGEMENT",
    driver: "ODBC Driver 17 for SQL Server",
    options: baseOptions,
};

// Sdílené connection pooly — vytvoří se jednou a znovu se používají
let hrPool: sql.ConnectionPool | null = null;
let userMgmtPool: sql.ConnectionPool | null = null;

/** Pool pro HR databázi (školení, prohlídky, ILUO, OOPP, zaměstnanci) */
export async function getPool(): Promise<sql.ConnectionPool> {
    if (hrPool && hrPool.connected) return hrPool;
    hrPool = await new sql.ConnectionPool(hrConfig).connect();
    return hrPool;
}

/** Pool pro USER_MANAGEMENT databázi (dbo.USERS — zdrojová tabulka uživatelů) */
export async function getUserManagementPool(): Promise<sql.ConnectionPool> {
    if (userMgmtPool && userMgmtPool.connected) return userMgmtPool;
    userMgmtPool = await new sql.ConnectionPool(userMgmtConfig).connect();
    return userMgmtPool;
}

/**
 * Spustí SQL dotaz a vrátí výsledky.
 * Příklad: const result = await query`SELECT * FROM EMPLOYEES WHERE PersonalNumber = ${pn}`
 */
export async function query<T = sql.IRecordSet<Record<string, unknown>>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
): Promise<T> {
    const db = await getPool();
    const request = db.request();

    // Sestavení dotazu s parametrizovanými hodnotami (ochrana před SQL injection)
    let sqlText = "";
    strings.forEach((str, i) => {
        sqlText += str;
        if (i < values.length) {
            const paramName = `p${i}`;
            request.input(paramName, values[i]);
            sqlText += `@${paramName}`;
        }
    });

    const result = await request.query(sqlText);
    return result.recordset as T;
}

export { sql };
