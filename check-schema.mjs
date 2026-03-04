import { getPool } from "./lib/db.ts";

async function checkSchema() {
    try {
        const db = await getPool();
        const tables = ["MEDICAL_EXAM_RECORDS", "TRAININGS", "TRAINING_SESSIONS", "TRAINING_PARTICIPANTS", "EMPLOYEES"];
        
        for (const table of tables) {
            console.log(`--- Schema for ${table} ---`);
            const res = await db.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = '${table}'
                AND TABLE_SCHEMA = 'dbo'
                ORDER BY ORDINAL_POSITION
            `);
            console.table(res.recordset);

            const identityRes = await db.request().query(`
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 1
                AND TABLE_NAME = '${table}'
            `);
            if (identityRes.recordset.length > 0) {
                console.log(`Identity Column: ${identityRes.recordset[0].COLUMN_NAME}`);
            } else {
                console.log("No Identity Column found.");
            }
            console.log();
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
