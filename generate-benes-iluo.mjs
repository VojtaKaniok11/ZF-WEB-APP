import sql from 'mssql/msnodesqlv8.js';

async function generateBenesIluo() {
    try {
        const pool = await sql.connect({
            server: 'VojtaKaniok\\SQLTESTOVACI',
            database: 'HR',
            driver: 'ODBC Driver 17 for SQL Server',
            options: { trustedConnection: true }
        });

        // 1. Najít osobní číslo Ladislava Beneše
        const empReq = await pool.request().query("SELECT PersonalNumber FROM dbo.EMPLOYEES WHERE FirstName = 'Ladislav' AND LastName = 'Beneš'");
        if (empReq.recordset.length === 0) {
            console.log("Ladislav Beneš nebyl nalezen v databázi.");
            process.exit(1);
        }
        const pn = empReq.recordset[0].PersonalNumber;
        console.log(`Nalezen Ladislav Beneš s číslem: ${pn}`);

        // 2. Smazat jeho dosavadní ILUO hodnocení aby to bylo čisté
        await pool.request().query(`DELETE FROM dbo.ILUO_ASSESSMENTS WHERE EmployeePersonalNumber = '${pn}'`);

        // 3. Načíst nějaké existující skillId (dovednosti)
        const skillsReq = await pool.request().query("SELECT TOP 12 ID FROM dbo.ILUO_SKILLS");
        const skills = skillsReq.recordset;

        if (skills.length < 12) {
            console.log("Varování: V tabulce ILUO_SKILLS není 12 dovedností, vygeneruje se méně.");
        }

        const levels = ['I', 'L', 'U', 'O'];
        let inserted = 0;

        for (const skill of skills) {
            const skId = skill.ID;
            const currentLvl = levels[Math.floor(Math.random() * levels.length)];
            const targetLvl = 'O'; // Dáme všem cíl O pro jednoduchost

            const queryStr = `
                INSERT INTO dbo.ILUO_ASSESSMENTS (ID, EmployeePersonalNumber, SkillID, Level, TargetLevel, AssessmentDate, AssessorName, Notes)
                VALUES (NEWID(), '${pn}', '${skId}', '${currentLvl}', '${targetLvl}', SYSDATETIME(), 'Vedoucí testu', 'Testovací seeding')
             `;
            try {
                await pool.request().query(queryStr);
                inserted++;
            } catch (err) {
                console.error("Failed query:", queryStr);
                console.error("Error:", err.message.substring(0, 100));
                console.error("Error part2:", err.message.substring(err.message.indexOf("column '") || 0));
                process.exit(1);
            }
        }

        console.log(`Hotovo! Úspěšně vloženo ${inserted} ILUO záznamů pro Ladislava Beneše (${pn}).`);
        process.exit(0);

    } catch (e) {
        console.error("Chyba:", e);
        process.exit(1);
    }
}

generateBenesIluo();
