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

    console.log('=== PART 2: TRAININGS & MEDICAL ===');

    // =========================================================================
    // TRAININGS
    // =========================================================================
    await r.query(`IF OBJECT_ID('dbo.TRAINING_PARTICIPANTS','U') IS NOT NULL DROP TABLE dbo.TRAINING_PARTICIPANTS;`);
    await r.query(`IF OBJECT_ID('dbo.TRAINING_ATTENDEES','U') IS NOT NULL DROP TABLE dbo.TRAINING_ATTENDEES;`);
    await r.query(`IF OBJECT_ID('dbo.TRAINING_SESSIONS','U') IS NOT NULL DROP TABLE dbo.TRAINING_SESSIONS;`);
    await r.query(`IF OBJECT_ID('dbo.TRAININGS','U') IS NOT NULL DROP TABLE dbo.TRAININGS;`);

    await r.query(`
        CREATE TABLE dbo.TRAININGS (
            ID             NVARCHAR(50)  NOT NULL PRIMARY KEY,
            Name           NVARCHAR(200) NOT NULL,
            Description    NVARCHAR(500) NULL,
            ValidityMonths INT           NOT NULL DEFAULT 0,
            Category       NVARCHAR(100) NOT NULL,
            IsMandatory    BIT           NOT NULL DEFAULT 0
        );
        CREATE TABLE dbo.TRAINING_SESSIONS (
            ID           NVARCHAR(50)  NOT NULL PRIMARY KEY,
            TrainingID   NVARCHAR(50)  NOT NULL FOREIGN KEY REFERENCES dbo.TRAININGS(ID),
            SessionDate  DATE          NOT NULL,
            TrainerName  NVARCHAR(100) NULL,
            Location     NVARCHAR(100) NULL,
            Notes        NVARCHAR(500) NULL
        );
        CREATE TABLE dbo.TRAINING_ATTENDEES (
            SessionID          NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.TRAINING_SESSIONS(ID),
            PersonalNumber     NVARCHAR(20) NOT NULL,
            Status             NVARCHAR(20) NULL, -- 'valid' / 'expired' (optional override)
            ExpirationDateOverride DATE NULL,
            PRIMARY KEY (SessionID, PersonalNumber)
        );
    `);

    // Seed TRAININGS
    await r.query(`
        INSERT INTO dbo.TRAININGS (ID, Name, Description, ValidityMonths, Category, IsMandatory) VALUES
        ('TRN-001', 'BOZP – Vstupní školení', 'Základní školení bezpečnosti', 24, 'BOZP', 1),
        ('TRN-002', 'BOZP – Periodické školení', 'Pravidelné opakování školení BOZP', 12, 'BOZP', 1),
        ('TRN-003', 'Požární ochrana', 'Evakuační plány, použití hasicích přístrojů', 12, 'PO', 1),
        ('TRN-004', 'Svařování – Základní kurz', 'Odborné školení pro svářeče', 24, 'Odborné', 0),
        ('TRN-005', 'Obsluha VZV', 'Vysokozdvižné vozíky', 12, 'Odborné', 0),
        ('TRN-006', 'Práce ve výškách', 'Bezpečnost při práci ve výškách', 12, 'BOZP', 0),
        ('TRN-007', 'První pomoc', 'Školení první pomoci', 24, 'BOZP', 1),
        ('TRN-008', 'GDPR a ochrana dat', 'Školení o ochraně osobních údajů', 12, 'Legislativní', 1);
    `);

    // Seed SESSIONS and ATTENDEES (We'll use JS arrays to make it easier to link to real personal numbers)
    const sessions = [
        { id: 'TSESS-001', tId: 'TRN-001', d: '2024-01-15', tr: 'Ing. Karel Novotný', loc: 'A', attendees: ['TEST001', 'TEST002', 'TEST003', 'TEST004', 'TEST005'] },
        { id: 'TSESS-002', tId: 'TRN-002', d: '2024-03-10', tr: 'Ing. Karel Novotný', loc: 'A', attendees: ['TEST001', 'TEST002', 'TEST003', 'TEST004', 'TEST005', 'TEST006', 'TEST007', 'TEST008'] },
        { id: 'TSESS-004', tId: 'TRN-004', d: '2024-02-20', tr: 'Ing. Vladimír Černý', loc: 'Svařovna', attendees: ['TEST005', 'TEST017', 'TEST025', 'TEST036'] },
        { id: 'TSESS-005', tId: 'TRN-005', d: '2024-04-05', tr: 'Jan Procházka ml.', loc: 'Sklad', attendees: ['TEST006', 'TEST007', 'TEST008', 'TEST018', 'TEST032'] }
    ];

    for (const s of sessions) {
        let rs = pool.request();
        rs.input('id', sql.NVarChar, s.id);
        rs.input('tid', sql.NVarChar, s.tId);
        rs.input('d', sql.Date, new Date(s.d));
        rs.input('tr', sql.NVarChar, s.tr);
        rs.input('loc', sql.NVarChar, s.loc);
        await rs.query(`INSERT INTO dbo.TRAINING_SESSIONS (ID, TrainingID, SessionDate, TrainerName, Location) VALUES (@id, @tid, @d, @tr, @loc)`);

        for (const pn of s.attendees) {
            let ra = pool.request();
            ra.input('sid', sql.NVarChar, s.id);
            ra.input('pn', sql.NVarChar, pn);
            await ra.query(`INSERT INTO dbo.TRAINING_ATTENDEES (SessionID, PersonalNumber) VALUES (@sid, @pn)`);
        }
    }
    console.log('✅ TRAININGS seeded');

    // =========================================================================
    // MEDICAL
    // =========================================================================
    await r.query(`IF OBJECT_ID('dbo.EMPLOYEE_MEDICAL_EXAMS','U') IS NOT NULL DROP TABLE dbo.EMPLOYEE_MEDICAL_EXAMS;`);
    await r.query(`IF OBJECT_ID('dbo.MEDICAL_EXAM_RECORDS','U') IS NOT NULL DROP TABLE dbo.MEDICAL_EXAM_RECORDS;`);
    await r.query(`IF OBJECT_ID('dbo.MEDICAL_EXAM_TYPES','U') IS NOT NULL DROP TABLE dbo.MEDICAL_EXAM_TYPES;`);

    await r.query(`
        CREATE TABLE dbo.MEDICAL_EXAM_TYPES (
            ID             NVARCHAR(50)  NOT NULL PRIMARY KEY,
            Name           NVARCHAR(200) NOT NULL,
            Description    NVARCHAR(500) NULL,
            ValidityMonths INT           NOT NULL DEFAULT 0,
            Category       NVARCHAR(100) NOT NULL
        );
        CREATE TABLE dbo.MEDICAL_EXAM_RECORDS (
            ID                     NVARCHAR(50)  NOT NULL PRIMARY KEY,
            ExamTypeID             NVARCHAR(50)  NOT NULL FOREIGN KEY REFERENCES dbo.MEDICAL_EXAM_TYPES(ID),
            EmployeePersonalNumber NVARCHAR(20)  NOT NULL, -- logical FK
            ExamDate               DATE          NOT NULL,
            NextExamDate           DATE          NULL,
            DoctorName             NVARCHAR(100) NULL,
            Result                 NVARCHAR(100) NULL,
            Notes                  NVARCHAR(500) NULL,
            StatusOverride         NVARCHAR(50)  NULL
        );
    `);

    await r.query(`
        INSERT INTO dbo.MEDICAL_EXAM_TYPES (ID, Name, Description, ValidityMonths, Category) VALUES
        ('MED-001', 'Vstupní prohlídka', 'Vstupní lékařská prohlídka při nástupu', 0, 'Vstupní'),
        ('MED-002', 'Periodická prohlídka – obecná', 'Pravidelná periodická prohlídka', 24, 'Periodická'),
        ('MED-003', 'Periodická prohlídka – riziková pracoviště', 'Zkrácená perioda', 12, 'Periodická'),
        ('MED-004', 'Řidičský průkaz', 'Prohlídka pro řidiče referentských vozidel', 24, 'Řidičský průkaz'),
        ('MED-005', 'Noční práce', 'Způsobilost pro noční směny', 12, 'Periodická');
    `);

    const medRecords = [
        ['MEXR-001', 'MED-001', 'TEST001', '2020-01-05', null, 'MUDr. Dagmar Šimková', 'Způsobilý'],
        ['MEXR-002', 'MED-002', 'TEST001', '2024-06-10', '2026-06-10', 'MUDr. Dagmar Šimková', 'Způsobilý'],
        ['MEXR-004', 'MED-001', 'TEST002', '2020-02-10', null, 'MUDr. Dagmar Šimková', 'Způsobilý'],
        ['MEXR-005', 'MED-002', 'TEST002', '2024-07-15', '2026-07-15', 'MUDr. Dagmar Šimková', 'Způsobilý'],
        ['MEXR-006', 'MED-001', 'TEST003', '2020-03-01', null, 'MUDr. Jan Kříž', 'Způsobilý'],
        ['MEXR-007', 'MED-002', 'TEST003', '2024-04-20', '2026-04-20', 'MUDr. Jan Kříž', 'Způsobilý - brýle'],
        ['MEXR-011', 'MED-001', 'TEST005', '2020-05-18', null, 'MUDr. Jan Kříž', 'Způsobilý'],
        ['MEXR-012', 'MED-003', 'TEST005', '2025-01-20', '2026-01-20', 'MUDr. Jan Kříž', 'Způsobilý'],
    ];

    for (const [id, tid, pn, ed, nd, d, res] of medRecords) {
        let rm = pool.request();
        rm.input('id', sql.NVarChar, id);
        rm.input('tid', sql.NVarChar, tid);
        rm.input('pn', sql.NVarChar, pn);
        rm.input('ed', sql.Date, new Date(ed));
        rm.input('nd', nd ? sql.Date : sql.Date, nd ? new Date(nd) : null);
        rm.input('d', sql.NVarChar, d);
        rm.input('res', sql.NVarChar, res);
        await rm.query(`
            INSERT INTO dbo.MEDICAL_EXAM_RECORDS (ID, ExamTypeID, EmployeePersonalNumber, ExamDate, NextExamDate, DoctorName, Result)
            VALUES (@id, @tid, @pn, @ed, @nd, @d, @res)
        `);
    }

    console.log('✅ MEDICAL seeded');
    await pool.close();
    console.log('=== PART 2 DONE ===');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
