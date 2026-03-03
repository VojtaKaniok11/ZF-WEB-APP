import sql from 'mssql/msnodesqlv8.js';

const config = {
    server: 'VojtaKaniok\\SQLTESTOVACI',
    database: 'HR',
    driver: 'ODBC Driver 17 for SQL Server',
    options: { trustedConnection: true, trustServerCertificate: true, enableArithAbort: true },
};

async function run() {
    const pool = await new sql.ConnectionPool(config).connect();
    const r = pool.request();

    console.log('=== PART 3: ILUO & OOPP ===');

    // =========================================================================
    // ILUO
    // =========================================================================
    await r.query(`IF OBJECT_ID('dbo.EMPLOYEE_ILUO_RECORDS','U') IS NOT NULL DROP TABLE dbo.EMPLOYEE_ILUO_RECORDS;`);
    await r.query(`IF OBJECT_ID('dbo.ILUO_ASSESSMENTS','U') IS NOT NULL DROP TABLE dbo.ILUO_ASSESSMENTS;`);
    await r.query(`IF OBJECT_ID('dbo.ILUO_SKILLS','U') IS NOT NULL DROP TABLE dbo.ILUO_SKILLS;`);

    await r.query(`
        CREATE TABLE dbo.ILUO_SKILLS (
            ID             NVARCHAR(50)  NOT NULL PRIMARY KEY,
            Name           NVARCHAR(200) NOT NULL,
            Description    NVARCHAR(500) NULL,
            WorkCenterID   NVARCHAR(20)  NOT NULL FOREIGN KEY REFERENCES dbo.WORKCENTERS(ID),
            Category       NVARCHAR(100) NOT NULL
        );
        CREATE TABLE dbo.ILUO_ASSESSMENTS (
            ID                     NVARCHAR(50)  NOT NULL PRIMARY KEY,
            SkillID                NVARCHAR(50)  NOT NULL FOREIGN KEY REFERENCES dbo.ILUO_SKILLS(ID),
            EmployeePersonalNumber NVARCHAR(20)  NOT NULL,
            Level                  NVARCHAR(10)  NOT NULL,
            TargetLevel            NVARCHAR(10)  NULL,
            AssessmentDate         DATE          NOT NULL,
            NextReviewDate         DATE          NULL,
            AssessorName           NVARCHAR(100) NULL,
            Notes                  NVARCHAR(500) NULL
        );
    `);

    // Seed Skills
    const skills = [
        ['SKILL-001', 'Montáž podsestavy A1', 'Kompletní montáž podsestavy A1', 'WC-MNT-01', 'Výrobní'],
        ['SKILL-002', 'Montáž podsestavy A2', 'Montáž s automatickým šroubováním', 'WC-MNT-01', 'Výrobní'],
        ['SKILL-003', 'Vizuální kontrola MNT-01', 'Vizuální kontrola montážní lince 1', 'WC-MNT-01', 'Kvalita'],
        ['SKILL-006', 'Programování robota - svařování', 'Programování svařovacího robota KUKA', 'WC-SVR-01', 'Výrobní'],
        ['SKILL-007', 'Ruční svařování MIG/MAG', 'Svařování metodou MIG/MAG', 'WC-SVR-02', 'Výrobní'],
        ['SKILL-008', 'Kontrola svarů - vizuální', 'Vizuální kontrola svarů', 'WC-SVR-02', 'Kvalita'],
        ['SKILL-011', 'Obsluha VZV', 'Obsluha vozíků', 'WC-LOG-01', 'Logistika'],
        ['SKILL-013', 'Údržba pneumatiky', 'Prevence pneumatických systémů', 'WC-UDR-01', 'Údržba'],
        ['SKILL-014', 'Elektroúdržba do 1kV', 'Elektroúdržba', 'WC-UDR-01', 'Údržba']
    ];

    for (const [id, n, d, w, c] of skills) {
        let rs = pool.request();
        rs.input('id', sql.NVarChar, id);
        rs.input('n', sql.NVarChar, n);
        rs.input('d', sql.NVarChar, d);
        rs.input('w', sql.NVarChar, w);
        rs.input('c', sql.NVarChar, c);
        await rs.query(`INSERT INTO dbo.ILUO_SKILLS (ID, Name, Description, WorkCenterID, Category) VALUES (@id, @n, @d, @w, @c)`);
    }

    // Seed Assessments
    const assesses = [
        ['ASSESS-001', 'SKILL-001', 'TEST003', 'O', 'O', '2023-06-15', null, 'Ing. Karel Novotný', ''],
        ['ASSESS-005', 'SKILL-007', 'TEST005', 'O', 'O', '2023-09-01', '2025-09-01', 'Ing. Vladimír Černý', 'Certifikován'],
        ['ASSESS-011', 'SKILL-001', 'TEST011', 'U', 'O', '2024-02-15', '2025-08-15', 'Martin Dvořák', ''],
        ['ASSESS-016', 'SKILL-011', 'TEST006', 'O', 'O', '2023-07-01', '2025-07-01', 'Ing. Karel Novotný', 'Oprávnění VZV'],
        ['ASSESS-018', 'SKILL-013', 'TEST009', 'O', 'O', '2023-10-01', '2025-10-01', 'Ing. Karel Novotný', '']
    ];
    for (const [id, sid, pn, l, tl, d, nd, an, no] of assesses) {
        let ra = pool.request();
        ra.input('id', sql.NVarChar, id);
        ra.input('sid', sql.NVarChar, sid);
        ra.input('pn', sql.NVarChar, pn);
        ra.input('l', sql.NVarChar, l);
        ra.input('tl', sql.NVarChar, tl);
        ra.input('d', sql.Date, new Date(d));
        ra.input('nd', nd ? sql.Date : sql.Date, nd ? new Date(nd) : null);
        ra.input('an', sql.NVarChar, an);
        ra.input('no', sql.NVarChar, no);
        await ra.query(`
            INSERT INTO dbo.ILUO_ASSESSMENTS (ID, SkillID, EmployeePersonalNumber, Level, TargetLevel, AssessmentDate, NextReviewDate, AssessorName, Notes)
            VALUES (@id, @sid, @pn, @l, @tl, @d, @nd, @an, @no)
        `);
    }
    console.log('✅ ILUO seeded');

    // =========================================================================
    // OOPP
    // =========================================================================
    await r.query(`IF OBJECT_ID('dbo.OOPP_ISSUES','U') IS NOT NULL DROP TABLE dbo.OOPP_ISSUES;`);
    await r.query(`IF OBJECT_ID('dbo.OOPP_ENTITLEMENTS','U') IS NOT NULL DROP TABLE dbo.OOPP_ENTITLEMENTS;`);
    await r.query(`IF OBJECT_ID('dbo.OOPP_ITEMS','U') IS NOT NULL DROP TABLE dbo.OOPP_ITEMS;`);

    await r.query(`
        CREATE TABLE dbo.OOPP_ITEMS (
            ID          NVARCHAR(50)  NOT NULL PRIMARY KEY,
            Name        NVARCHAR(200) NOT NULL,
            Category    NVARCHAR(100) NOT NULL,
            Description NVARCHAR(500) NULL
        );
        CREATE TABLE dbo.OOPP_ENTITLEMENTS (
            ID                      NVARCHAR(50)  NOT NULL PRIMARY KEY,
            OoppItemID              NVARCHAR(50)  NOT NULL FOREIGN KEY REFERENCES dbo.OOPP_ITEMS(ID),
            Department              NVARCHAR(100) NULL,
            Position                NVARCHAR(100) NULL,
            EntitlementPeriodMonths INT           NOT NULL,
            Quantity                INT           NOT NULL
        );
        CREATE TABLE dbo.OOPP_ISSUES (
            ID                     NVARCHAR(50) NOT NULL PRIMARY KEY,
            OoppItemID             NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.OOPP_ITEMS(ID),
            EmployeePersonalNumber NVARCHAR(20) NOT NULL,
            IssueDate              DATE         NOT NULL,
            NextEntitlementDate    DATE         NULL,
            Quantity               INT          NOT NULL,
            Size                   NVARCHAR(50) NULL,
            Notes                  NVARCHAR(500) NULL
        );
    `);

    await r.query(`
        INSERT INTO dbo.OOPP_ITEMS (ID, Name, Category, Description) VALUES
        ('OOPP-001', 'Bezpečnostní obuv S3', 'Obuv', 'Bezpečnostní pracovní obuv se ocelovou špičkou'),
        ('OOPP-002', 'Pracovní rukavice – mechanické', 'Rukavice', 'Ochranné rukavice proti mechanickým rizikům'),
        ('OOPP-004', 'Ochranné brýle', 'Ochrana zraku', 'Ochranné brýle proti odlétajícím částicím'),
        ('OOPP-006', 'Ochranná přilba', 'Ochrana hlavy', 'Průmyslová ochranná přilba'),
        ('OOPP-009', 'Pracovní oděv – montérky', 'Oděv', 'Pracovní kalhoty s laclem');
        
        INSERT INTO dbo.OOPP_ENTITLEMENTS (ID, OoppItemID, Department, Position, EntitlementPeriodMonths, Quantity) VALUES
        ('ENT-001', 'OOPP-001', NULL, NULL, 12, 1),
        ('ENT-002', 'OOPP-004', NULL, NULL, 12, 1),
        ('ENT-004', 'OOPP-002', 'Montáž', NULL, 6, 2),
        ('ENT-005', 'OOPP-009', 'Montáž', NULL, 12, 2);
    `);

    const ooppData = [
        ['ISS-001', 'OOPP-001', 'TEST003', '2024-03-15', '2025-03-15', 1, '43', ''],
        ['ISS-002', 'OOPP-002', 'TEST003', '2024-09-01', '2025-03-01', 2, 'L', ''],
        ['ISS-009', 'OOPP-001', 'TEST006', '2024-04-01', '2025-04-01', 1, '38', ''],
        ['ISS-015', 'OOPP-001', 'TEST009', '2024-06-15', '2025-06-15', 1, '44', ''],
        ['ISS-019', 'OOPP-001', 'TEST011', '2024-07-01', '2025-07-01', 1, '43', '']
    ];
    for (const [id, oid, pn, i, n, q, s, no] of ooppData) {
        let ri = pool.request();
        ri.input('id', sql.NVarChar, id);
        ri.input('oid', sql.NVarChar, oid);
        ri.input('pn', sql.NVarChar, pn);
        ri.input('i', sql.Date, new Date(i));
        ri.input('n', n ? sql.Date : sql.Date, n ? new Date(n) : null);
        ri.input('q', sql.Int, q);
        ri.input('s', sql.NVarChar, s);
        ri.input('no', sql.NVarChar, no);
        await ri.query(`
            INSERT INTO dbo.OOPP_ISSUES (ID, OoppItemID, EmployeePersonalNumber, IssueDate, NextEntitlementDate, Quantity, Size, Notes)
            VALUES (@id, @oid, @pn, @i, @n, @q, @s, @no)
        `);
    }
    console.log('✅ OOPP seeded');

    await pool.close();
    console.log('=== PART 3 DONE ===');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
