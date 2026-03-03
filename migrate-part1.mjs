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

    console.log('=== PART 1: Schema + WORKCENTERS + EMPLOYEES columns ===');

    // 1) Přidej sloupce do EMPLOYEES pokud neexistují
    await r.query(`
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.EMPLOYEES') AND name='Phone')
            ALTER TABLE dbo.EMPLOYEES ADD Phone NVARCHAR(30) NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.EMPLOYEES') AND name='Mobile')
            ALTER TABLE dbo.EMPLOYEES ADD Mobile NVARCHAR(30) NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.EMPLOYEES') AND name='Email')
            ALTER TABLE dbo.EMPLOYEES ADD Email NVARCHAR(100) NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.EMPLOYEES') AND name='Position')
            ALTER TABLE dbo.EMPLOYEES ADD Position NVARCHAR(100) NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.EMPLOYEES') AND name='Level')
            ALTER TABLE dbo.EMPLOYEES ADD Level NVARCHAR(10) NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.EMPLOYEES') AND name='ManagerID')
            ALTER TABLE dbo.EMPLOYEES ADD ManagerID INT NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.EMPLOYEES') AND name='BIS_Osoba_ID')
            ALTER TABLE dbo.EMPLOYEES ADD BIS_Osoba_ID INT NULL;
    `);
    console.log('✅ EMPLOYEES columns added');

    // 2) Vytvoř WORKCENTERS (drop+create pro čistý stav)
    await r.query(`IF OBJECT_ID('dbo.WORKCENTERS','U') IS NOT NULL DROP TABLE dbo.WORKCENTERS;`);
    await r.query(`
        CREATE TABLE dbo.WORKCENTERS (
            ID          NVARCHAR(20)  NOT NULL PRIMARY KEY,
            WCName      NVARCHAR(100) NOT NULL,
            Description NVARCHAR(300) NULL,
            Department  NVARCHAR(100) NULL,
            CostCenter  INT           NULL,
            IsActive    BIT           NOT NULL DEFAULT 1
        );
    `);
    await r.query(`
        INSERT INTO dbo.WORKCENTERS(ID,WCName,Description,Department,CostCenter,IsActive) VALUES
        ('WC-MNT-01','Montáž – Linka 1','Hlavní montážní linka pro produkty řady A','Montáž',110,1),
        ('WC-MNT-02','Montáž – Linka 2','Sekundární montážní linka pro produkty řady B','Montáž',110,1),
        ('WC-SVR-01','Svařovna – Robot 1','Robotické svařování podvozků','Sváření',130,1),
        ('WC-SVR-02','Svařovna – Ruční','Ruční svařování a opravy','Sváření',130,1),
        ('WC-LAK-01','Lakovna – KTL','Kataforetické lakování','Lakovna',180,1),
        ('WC-KJC-01','Kontrola kvality – Vstupní','Vstupní kontrola dodávaných dílů','Kvalita',120,1),
        ('WC-KJC-02','Kontrola kvality – Výstupní','Výstupní kontrola hotových produktů','Kvalita',120,1),
        ('WC-LOG-01','Logistika – Příjem','Příjem materiálu a vstupní logistika','Logistika',140,1),
        ('WC-SKL-01','Sklad – Hlavní','Hlavní sklad materiálu a komponent','Sklad',150,0),
        ('WC-UDR-01','Údržba – Dílna','Centrální údržbářská dílna','Údržba',160,1),
        ('WC-BAL-01','Balení – Linka A','Balení a expedice hotových výrobků','Balení',155,1),
        ('WC-VYV-01','Vývoj – Konstruktéři','Vývojová kancelář a dílna','Vývoj',170,1),
        ('WC-RIZ-01','Řízení výroby','Plánování a řízení výrobního procesu','Řízení výroby',190,1);
    `);
    console.log('✅ WORKCENTERS seeded (13 rows)');

    // 3) Update EMPLOYEES se základními daty (telefon, email, pozice, level, manažer)
    const empUpdates = [
        [98, 'TEST001', '+420 555 001 001', '+420 777 001 001', 'jan.novak@zf.com', 'Ředitel závodu', 'L1', null, 1001],
        [99, 'TEST002', '+420 555 002 002', '+420 777 002 002', 'petra.svobodova@zf.com', 'IT Manager', 'L2', 98, 1002],
        [100, 'TEST003', '+420 555 003 003', '+420 777 003 003', 'martin.dvorak@zf.com', 'Mistr směny', 'L3', 98, 1003],
        [101, 'TEST004', '+420 555 004 004', '+420 777 004 004', 'eva.cerna@zf.com', 'Inspektor kvality', 'L4', 98, 1004],
        [102, 'TEST005', '+420 555 005 005', '+420 777 005 005', 'tomas.prochazka@zf.com', 'Svářeč senior', 'L4', 100, 1005],
        [103, 'TEST006', '+420 555 006 006', '+420 777 006 006', 'lucie.vesela@zf.com', 'Koordinátor logistiky', 'L3', 98, 1006],
        [104, 'TEST007', '+420 555 007 007', '+420 777 007 007', 'jiri.kucera@zf.com', 'Skladník', 'L5', 103, 1007],
        [105, 'TEST008', '+420 555 008 008', '+420 777 008 008', 'marketa.horakova@zf.com', 'Operátor balení', 'L5', 103, 1008],
        [106, 'TEST009', '+420 555 009 009', '+420 777 009 009', 'pavel.marek@zf.com', 'Technik údržby', 'L4', 98, 1009],
        [107, 'TEST010', '+420 555 010 010', '+420 777 010 010', 'katerina.pokorna@zf.com', 'Vývojový inženýr', 'L3', 98, 1010],
        [108, 'TEST011', '+420 555 011 011', '+420 777 011 011', 'ondrej.fiala@zf.com', 'Operátor montáže', 'L5', 100, 1011],
        [109, 'TEST012', '+420 555 012 012', '+420 777 012 012', 'tereza.novakova@zf.com', 'Lakýrník', 'L5', 100, 1012],
        [110, 'TEST013', '+420 555 013 013', '+420 777 013 013', 'david.jelinek@zf.com', 'Systémový administrátor', 'L4', 99, 1013],
        [111, 'TEST014', '+420 555 014 014', '+420 777 014 014', 'anna.kratochvilova@zf.com', 'Technik kvality', 'L4', 101, 1014],
        [112, 'TEST015', '+420 555 015 015', '+420 777 015 015', 'michal.stastny@zf.com', 'Plánovač výroby', 'L3', 98, 1015],
        [113, 'TEST016', '+420 555 016 016', '+420 777 016 016', 'barbora.rihova@zf.com', 'Operátor montáže', 'L5', 100, 1016],
        [114, 'TEST017', '+420 555 017 017', '+420 777 017 017', 'vladimir.benes@zf.com', 'Svářeč', 'L5', 102, 1017],
        [115, 'TEST018', '+420 555 018 018', '+420 777 018 018', 'simona.urbanova@zf.com', 'Disponent', 'L4', 103, 1018],
        [116, 'TEST019', '+420 555 019 019', '+420 777 019 019', 'radek.kopecky@zf.com', 'Elektrikář', 'L5', 106, 1019],
        [117, 'TEST020', '+420 555 020 020', '+420 777 020 020', 'hana.vlckova@zf.com', 'Konstruktér', 'L4', 107, 1020],
        [118, 'TEST021', '+420 555 021 021', '+420 777 021 021', 'jakub.novotny@zf.com', 'Operátor montáže', 'L5', 100, 1021],
        [119, 'TEST022', '+420 555 022 022', '+420 777 022 022', 'lenka.rezacova@zf.com', 'Plánovač logistiky', 'L4', 103, 1022],
        [120, 'TEST023', '+420 555 023 023', '+420 777 023 023', 'roman.hajek@zf.com', 'Údržbář', 'L5', 106, 1023],
        [121, 'TEST024', '+420 555 024 024', '+420 777 024 024', 'veronika.mala@zf.com', 'Technik kvality', 'L4', 101, 1024],
        [122, 'TEST025', '+420 555 025 025', '+420 777 025 025', 'petr.blazek@zf.com', 'Operátor svařování', 'L5', 102, 1025],
        [123, 'TEST026', '+420 555 026 026', '+420 777 026 026', 'irena.ruzickova@zf.com', 'HR Specialista', 'L3', 98, 1026],
        [124, 'TEST027', '+420 555 027 027', '+420 777 027 027', 'tomas.semanovic@zf.com', 'Operátor balení', 'L5', 103, 1027],
        [125, 'TEST028', '+420 555 028 028', '+420 777 028 028', 'martin.kohout@zf.com', 'Kontrolor kvality', 'L4', 101, 1028],
        [126, 'TEST029', '+420 555 029 029', '+420 777 029 029', 'zuzana.pokorna@zf.com', 'Lakýrník senior', 'L4', 100, 1029],
        [127, 'TEST030', '+420 555 030 030', '+420 777 030 030', 'ondrej.simecek@zf.com', 'IT Analytik', 'L4', 99, 1030],
        [128, 'TEST031', '+420 555 031 031', '+420 777 031 031', 'alena.kolarikova@zf.com', 'Operátor montáže', 'L5', 100, 1031],
        [129, 'TEST032', '+420 555 032 032', '+420 777 032 032', 'jan.horak@zf.com', 'Skladník senior', 'L4', 103, 1032],
        [130, 'TEST033', '+420 555 033 033', '+420 777 033 033', 'kamila.bartova@zf.com', 'Disponent', 'L4', 103, 1033],
        [131, 'TEST034', '+420 555 034 034', '+420 777 034 034', 'lukas.rysavy@zf.com', 'Elektrikář senior', 'L3', 106, 1034],
        [132, 'TEST035', '+420 555 035 035', '+420 777 035 035', 'monika.paulusova@zf.com', 'Vývojový inženýr', 'L3', 107, 1035],
        [133, 'TEST036', '+420 555 036 036', '+420 777 036 036', 'david.vorlicek@zf.com', 'Svářeč', 'L5', 102, 1036],
        [134, 'TEST037', '+420 555 037 037', '+420 777 037 037', 'marie.hruskova@zf.com', 'Operátor balení', 'L5', 103, 1037],
        [135, 'TEST038', '+420 555 038 038', '+420 777 038 038', 'jiri.dostal@zf.com', 'Technik procesů', 'L3', 98, 1038],
        [136, 'TEST039', '+420 555 039 039', '+420 777 039 039', 'pavla.krejci@zf.com', 'Referent kvality', 'L4', 101, 1039],
        [137, 'TEST040', '+420 555 040 040', '+420 777 040 040', 'stanislav.cermak@zf.com', 'Plánovač výroby', 'L3', 112, 1040],
    ];

    for (const [id, pn, phone, mobile, email, pos, lvl, mgr, bisId] of empUpdates) {
        const req2 = pool.request();
        req2.input('phone', sql.NVarChar, phone);
        req2.input('mobile', sql.NVarChar, mobile);
        req2.input('email', sql.NVarChar, email);
        req2.input('pos', sql.NVarChar, pos);
        req2.input('lvl', sql.NVarChar, lvl);
        req2.input('mgr', mgr === null ? sql.Int : sql.Int, mgr);
        req2.input('bisId', sql.Int, bisId);
        req2.input('id', sql.Int, id);
        await req2.query(`
            UPDATE dbo.EMPLOYEES SET
                Phone=@phone, Mobile=@mobile, Email=@email,
                Position=@pos, Level=@lvl, ManagerID=@mgr, BIS_Osoba_ID=@bisId
            WHERE ID=@id
        `);
    }
    console.log('✅ EMPLOYEES updated (40 rows)');

    await pool.close();
    console.log('=== PART 1 DONE ===');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
