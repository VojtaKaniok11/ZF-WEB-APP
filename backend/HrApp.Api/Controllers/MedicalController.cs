using Dapper;
using HrApp.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace HrApp.Api.Controllers
{
    [ApiController]
    [Route("api/medical")]
    public class MedicalController : ControllerBase
    {
        private readonly ISqlConnectionFactory _connectionFactory;
        private readonly ILogger<MedicalController> _logger;
        // Příznak "aktivní prohlídka" (analogie ke školení) v MEDICAL_EXAM_RECORDS.LegacyIsActive.
        // Když = 0 → prohlídka je deaktivovaná → stav "0"/"inactive", ne platné/propadlé.
        private static bool _schemaChecked = false;
        private static bool _hasLegacyActive = false;

        public MedicalController(ISqlConnectionFactory connectionFactory, ILogger<MedicalController> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        // Jednorázově zajistí sloupec LegacyIsActive na MEDICAL_EXAM_RECORDS a zjistí jeho dostupnost.
        private async Task EnsureSchemaAsync(System.Data.IDbConnection connection)
        {
            if (_schemaChecked) return;
            try
            {
                await connection.ExecuteAsync(@"
                    IF COL_LENGTH('dbo.MEDICAL_EXAM_RECORDS', 'LegacyIsActive') IS NULL
                        ALTER TABLE dbo.MEDICAL_EXAM_RECORDS ADD LegacyIsActive BIT NULL;");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not auto-create MEDICAL_EXAM_RECORDS.LegacyIsActive column.");
            }
            try
            {
                _hasLegacyActive = await connection.QueryFirstAsync<int>(
                    "SELECT CASE WHEN COL_LENGTH('dbo.MEDICAL_EXAM_RECORDS','LegacyIsActive') IS NOT NULL THEN 1 ELSE 0 END") == 1;
            }
            catch { _hasLegacyActive = false; }
            _schemaChecked = true;
        }

        [HttpGet("types/{typeId}")]
        public async Task<IActionResult> GetMedicalTypeDetail(string typeId)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureSchemaAsync(connection);
                string tid = Uri.UnescapeDataString(typeId);
                string tSql = "SELECT ID as id, Name as name, ValidityMonths as validityMonths, Category as category, ISNULL(MedicalFacility, '') AS medicalFacility, ISNULL(Description, '') AS description FROM dbo.MEDICAL_EXAM_TYPES WHERE ID = @tid";
                var type = await connection.QueryFirstOrDefaultAsync(tSql, new { tid });
                if (type == null) return NotFound(new { success = false });

                // Periodické varianty téže prohlídky ("… po 2 / 4 / 6 letech") jsou jedna prohlídka.
                // Najdeme všechny typy se stejným základním názvem (bez periody) – tzv. sourozenci.
                // Reálný stav má jen ten typ, který drží NEJNOVĚJŠÍ záznam zaměstnance; ostatní → "superseded" ("—").
                string baseName = StripPeriodicitySuffix((string)type.name).ToLowerInvariant();
                var allTypes = await connection.QueryAsync(
                    "SELECT ID AS id, Name AS name FROM dbo.MEDICAL_EXAM_TYPES");
                var siblingIds = allTypes
                    .Where(t => StripPeriodicitySuffix((string)t.name).ToLowerInvariant() == baseName)
                    .Select(t => (string)t.id)
                    .ToList();
                if (!siblingIds.Contains(tid)) siblingIds.Add(tid);

                // Deaktivovaná prohlídka (LegacyIsActive = 0) → stav "0" místo platné/propadlé. Jen pokud sloupec existuje.
                string aktSelect = _hasLegacyActive ? ", r.LegacyIsActive" : "";
                string aktCase = _hasLegacyActive ? "WHEN em.LegacyIsActive = 0 THEN '0'\n                                " : "";

                string eSql = $@"
                    SELECT ISNULL(u.BIS_Jmeno, '') AS firstName, ISNULL(u.BIS_Prijmeni, '') AS lastName, ISNULL(u.BIS_Osobni_cislo, '') AS personalNumber, ISNULL(u.Oddeleni, '') AS department, e.HiringDate AS hiringDate,
                           ISNULL(CAST(u.Nakladove_Stredisko AS VARCHAR), ISNULL(e.CostNumber, '')) AS costNumber,
                           ISNULL(sp_cc.STREDISKO_POPIS, ISNULL(e.CostNumberDesc, '')) AS costNumberDesc,
                           CAST(CASE WHEN em.ExamDate IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS hasCompleted, em.ExamDate AS completionDate, em.NextExamDate AS expirationDate,
                           ISNULL(em.Notes, '') AS notes,
                           CASE WHEN em.ExamDate IS NULL THEN 'Neproškolen'
                                WHEN nb.NewestTypeId IS NOT NULL AND nb.NewestTypeId <> @tid THEN 'superseded'
                                {aktCase}WHEN em.NextExamDate < CAST(SYSDATETIME() AS DATE) THEN 'Neplatné'
                                WHEN DATEDIFF(day, CAST(SYSDATETIME() AS DATE), em.NextExamDate) <= 30 THEN 'Blíží se expirace'
                                ELSE 'Platné' END AS validityStatus
                    FROM (SELECT *, ROW_NUMBER() OVER(PARTITION BY BIS_Osobni_cislo ORDER BY ID DESC) AS rn FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osobni_cislo IS NOT NULL AND BIS_Aktivni = 1) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                    LEFT JOIN USER_MANAGEMENT.dbo.STREDISKO_POPIS sp_cc ON TRY_CONVERT(decimal(18,4), sp_cc.STREDISKO) = TRY_CONVERT(decimal(18,4), u.Nakladove_Stredisko)
                     OUTER APPLY (
                         SELECT TOP 1 ExamDate, NextExamDate, Notes{aktSelect}
                         FROM dbo.MEDICAL_EXAM_RECORDS r
                         WHERE r.EmployeePersonalNumber = u.BIS_Osobni_cislo AND r.ExamTypeID = @tid
                         ORDER BY r.ExamDate DESC
                     ) em
                     OUTER APPLY (
                         SELECT TOP 1 r2.ExamTypeID AS NewestTypeId
                         FROM dbo.MEDICAL_EXAM_RECORDS r2
                         WHERE r2.EmployeePersonalNumber = u.BIS_Osobni_cislo AND r2.ExamTypeID IN @siblingIds
                         ORDER BY r2.ExamDate DESC, r2.ID DESC
                     ) nb
                     WHERE u.rn = 1 AND u.BIS_Aktivni = 1
                     ORDER BY u.BIS_Prijmeni, u.BIS_Jmeno";
                var employees = await connection.QueryAsync(eSql, new { tid, siblingIds });
                return Ok(new { success = true, medicalType = type, employees = employees });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/medical/types/{typeId}] Error");
                return StatusCode(500, new { success = false });
            }
        }

        // Smaže celý typ lékařské prohlídky VČETNĚ všech záznamů zaměstnanců. Nevratné.
        [HttpDelete("types/{typeId}")]
        public async Task<IActionResult> DeleteMedicalType(string typeId)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string tid = Uri.UnescapeDataString(typeId);
                // Nejdřív navázané záznamy (FK), pak typ prohlídky.
                await connection.ExecuteAsync("DELETE FROM dbo.MEDICAL_EXAM_RECORDS WHERE ExamTypeID = @tid", new { tid });
                int affected = await connection.ExecuteAsync("DELETE FROM dbo.MEDICAL_EXAM_TYPES WHERE ID = @tid", new { tid });
                if (affected == 0) return NotFound(new { success = false, message = "Prohlídka nebyla nalezena." });
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DELETE /api/medical/types/{typeId}] Error");
                return StatusCode(500, new { success = false, message = "Smazání prohlídky se nezdařilo." });
            }
        }

        // Smaže záznam(y) jednoho zaměstnance o této prohlídce (např. přidané omylem). Nevratné.
        [HttpDelete("types/{typeId}/records/{personalNumber}")]
        public async Task<IActionResult> DeleteMedicalRecord(string typeId, string personalNumber)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                int affected = await connection.ExecuteAsync(
                    "DELETE FROM dbo.MEDICAL_EXAM_RECORDS WHERE ExamTypeID = @tid AND EmployeePersonalNumber = @pn",
                    new { tid = Uri.UnescapeDataString(typeId), pn = Uri.UnescapeDataString(personalNumber) });
                return Ok(new { success = true, deleted = affected });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DELETE /api/medical/types/{typeId}/records/{personalNumber}] Error");
                return StatusCode(500, new { success = false, message = "Smazání záznamu se nezdařilo." });
            }
        }

        [HttpGet("export")]
        public async Task<IActionResult> GetExportData([FromQuery] string? category, [FromQuery] string? search)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();

                // Filtry se aplikují až na výsledné (existující) prohlídky zaměstnanců.
                var conditions = new List<string> { "r.rn = 1" };
                var parameters = new DynamicParameters();

                if (!string.IsNullOrWhiteSpace(category) && category != "Vše")
                {
                    conditions.Add("r.ExamCategory = @category");
                    parameters.Add("category", category);
                }
                if (!string.IsNullOrWhiteSpace(search))
                {
                    conditions.Add("(r.ExamName LIKE @search OR r.ExamCategory LIKE @search)");
                    parameters.Add("search", $"%{search}%");
                }

                string whereClause = "WHERE " + string.Join(" AND ", conditions);

                // Stejně jako u školení: jen prohlídky, které zaměstnanec opravdu má (záznam v MEDICAL_EXAM_RECORDS),
                // pro každý typ jen nejnovější záznam. Stav se dopočítá v C# – včetně sloučení periodických
                // prohlídek lišících se jen periodou ("po 2/4/6 letech") → starší dostanou "—".
                string sql = $@"
                    WITH RankedRecords AS (
                        SELECT
                            em.EmployeePersonalNumber                      AS PersonalNumber,
                            em.ID                                          AS RecordId,
                            mt.Name                                        AS ExamName,
                            mt.Category                                    AS ExamCategory,
                            em.ExamDate                                    AS CompletionDate,
                            em.NextExamDate                                AS ExpirationDate,
                            mt.ValidityMonths                              AS PeriodicityMonths,
                            ROW_NUMBER() OVER(PARTITION BY em.EmployeePersonalNumber, mt.ID ORDER BY em.ExamDate DESC, em.ID DESC) AS rn
                        FROM dbo.MEDICAL_EXAM_RECORDS em
                        JOIN dbo.MEDICAL_EXAM_TYPES mt ON mt.ID = em.ExamTypeID
                    )
                    SELECT
                        ISNULL(u.BIS_Osobni_cislo, '')                                             AS PersonalNumber,
                        ISNULL(u.BIS_Prijmeni, '')                                                 AS LastName,
                        ISNULL(u.BIS_Jmeno, '')                                                    AS FirstName,
                        ISNULL(CAST(u.Kategorie AS VARCHAR), ISNULL(e.Category, ''))               AS EmployeeCategory,
                        ISNULL(CAST(u.Nakladove_Stredisko AS VARCHAR), ISNULL(e.CostNumber, ''))   AS CostNumber,
                        ISNULL(sp_cc.STREDISKO_POPIS, ISNULL(e.CostNumberDesc, ''))                AS CostNumberDesc,
                        r.ExamCategory                                                             AS ExamCategory,
                        r.ExamName                                                                 AS ExamName,
                        r.RecordId                                                                 AS RecordId,
                        r.CompletionDate                                                           AS CompletionDate,
                        r.ExpirationDate                                                           AS ExpirationDate,
                        r.PeriodicityMonths                                                        AS PeriodicityMonths
                    FROM RankedRecords r
                    JOIN (
                        SELECT *, ROW_NUMBER() OVER(PARTITION BY BIS_Osobni_cislo ORDER BY ID DESC) AS urn
                        FROM USER_MANAGEMENT.dbo.USERS
                        WHERE BIS_Aktivni = 1 AND BIS_Osobni_cislo IS NOT NULL
                    ) u ON u.BIS_Osobni_cislo = r.PersonalNumber AND u.urn = 1
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                    LEFT JOIN USER_MANAGEMENT.dbo.STREDISKO_POPIS sp_cc ON TRY_CONVERT(decimal(18,4), sp_cc.STREDISKO) = TRY_CONVERT(decimal(18,4), u.Nakladove_Stredisko)
                    {whereClause}
                    ORDER BY u.BIS_Prijmeni, u.BIS_Jmeno, r.ExamCategory, r.ExamName";

                var rows = (await connection.QueryAsync<MedicalExportRow>(sql, parameters)).ToList();
                var today = DateTime.Today;

                // Skupina "stejné" prohlídky v rámci jednoho zaměstnance: jen základní název (bez periody).
                // Kategorie se do klíče NEdává – periodické varianty mají různou kategorii.
                string GroupKey(MedicalExportRow r) =>
                    (r.PersonalNumber + "|" + StripPeriodicitySuffix(r.ExamName)).ToLowerInvariant();

                var newestRecordIdPerGroup = rows
                    .GroupBy(GroupKey)
                    .ToDictionary(
                        g => g.Key,
                        g => g.OrderByDescending(r => r.CompletionDate)
                              .ThenByDescending(r => r.RecordId, StringComparer.Ordinal)
                              .First().RecordId);

                var data = rows.Select(r =>
                {
                    bool isNewestInGroup = newestRecordIdPerGroup[GroupKey(r)] == r.RecordId;
                    string status = isNewestInGroup ? StatusToCzech(ComputeStatus(r.ExpirationDate, today)) : "—";
                    return new
                    {
                        personalNumber = r.PersonalNumber,
                        lastName = r.LastName,
                        firstName = r.FirstName,
                        employeeCategory = r.EmployeeCategory,
                        costNumber = r.CostNumber,
                        costNumberDesc = r.CostNumberDesc,
                        examCategory = r.ExamCategory,
                        examName = r.ExamName,
                        completionDate = r.CompletionDate,
                        expirationDate = r.ExpirationDate,
                        periodicityMonths = r.PeriodicityMonths,
                        status = status
                    };
                }).ToList();

                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/medical/export] Error");
                return StatusCode(500, new { success = false });
            }
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetMedicalSummary()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var sql = @"
                    WITH RankedRecords AS (
                        SELECT
                            em.EmployeePersonalNumber AS personalNumber,
                            em.ExamTypeID AS examTypeId,
                            CONVERT(varchar(10), em.NextExamDate, 23) AS nextExamDate,
                            ROW_NUMBER() OVER(PARTITION BY em.EmployeePersonalNumber, em.ExamTypeID ORDER BY em.ExamDate DESC) as rn
                        FROM dbo.MEDICAL_EXAM_RECORDS em
                    )
                    SELECT personalNumber, examTypeId, nextExamDate
                    FROM RankedRecords
                    WHERE rn = 1";

                var records = await connection.QueryAsync(sql);
                var today = DateTime.Today;

                var resultList = records.Select(row =>
                {
                    DateTime? nextExam = string.IsNullOrEmpty(row.nextExamDate) ? null : DateTime.Parse(row.nextExamDate);
                    return new
                    {
                        personalNumber = (string)row.personalNumber,
                        examTypeId = (string)row.examTypeId,
                        status = ComputeStatus(nextExam, today)
                    };
                }).ToList();

                return Ok(new { success = true, data = resultList });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/medical/summary] Error");
                return StatusCode(500, new { success = false, data = new string[] {} });
            }
        }

        [HttpGet("{personalNumber}")]
        public async Task<IActionResult> GetMedicalRecords(string personalNumber)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureSchemaAsync(connection);
                var param = new { pn = Uri.UnescapeDataString(personalNumber) };

                // Deaktivovaná prohlídka (LegacyIsActive = 0) → stav "inactive" ("0"). Jen pokud sloupec existuje.
                string aktInner = _hasLegacyActive ? "em.LegacyIsActive                              AS LegacyIsActive," : "";
                string aktOuter = _hasLegacyActive ? "LegacyIsActive," : "";

                string sql = $@"
                    WITH RankedRecords AS (
                        SELECT
                            mt.ID                                          AS ExamTypeId,
                            em.ID                                          AS RecordId,
                            mt.Name                                        AS ExamTypeName,
                            mt.Category                                    AS Category,
                            CONVERT(varchar(10), em.ExamDate, 23)          AS ExamDate,
                            CONVERT(varchar(10), em.NextExamDate, 23)      AS NextExamDate,
                            ISNULL(em.Result, '')                          AS Result,
                            ISNULL(em.DoctorName, '')                      AS DoctorName,
                            ISNULL(em.Notes, '')                           AS Notes,
                            {aktInner}
                            mt.ValidityMonths                              AS PeriodicityMonths,
                            ROW_NUMBER() OVER(PARTITION BY mt.ID ORDER BY em.ExamDate DESC) AS rn
                        FROM dbo.MEDICAL_EXAM_RECORDS em
                        JOIN dbo.MEDICAL_EXAM_TYPES mt ON mt.ID = em.ExamTypeID
                        WHERE em.EmployeePersonalNumber = @pn
                    )
                    SELECT
                        ExamTypeId,
                        RecordId,
                        ExamTypeName,
                        Category,
                        ExamDate,
                        NextExamDate,
                        Result,
                        DoctorName,
                        Notes,
                        {aktOuter}
                        PeriodicityMonths
                    FROM RankedRecords
                    WHERE rn = 1
                    ORDER BY ExamDate DESC";

                var records = (await connection.QueryAsync<MedicalRecordDto>(sql, param)).ToList();

                var today = DateTime.Today;

                // Periodické prohlídky lišící se jen periodou ("po 2 / 4 / 6 letech") jsou ve skutečnosti
                // jedna a ta samá prohlídka. Reálný stav (Platné / Propadlé / …) si nechá jen ten NEJNOVĚJŠÍ
                // záznam ve skupině (podle data prohlídky); starší periody dostanou stav "superseded" ("-"),
                // aby bylo vidět, že zaměstnanec prohlídku absolvoval a jen se mu změnila perioda.
                var newestRecordIdPerGroup = records
                    .GroupBy(MedicalGroupKey)
                    .ToDictionary(
                        g => g.Key,
                        g => g.OrderByDescending(r => r.ExamDate, StringComparer.Ordinal)
                              .ThenByDescending(r => r.RecordId, StringComparer.Ordinal)
                              .First().RecordId);

                var resultList = records.Select(row =>
                {
                    DateTime? nextExam = string.IsNullOrEmpty(row.NextExamDate) ? null : DateTime.Parse(row.NextExamDate);
                    bool isNewestInGroup = newestRecordIdPerGroup[MedicalGroupKey(row)] == row.RecordId;

                    return new
                    {
                        examTypeId = row.ExamTypeId,
                        recordId = row.RecordId,
                        examTypeName = row.ExamTypeName,
                        category = row.Category ?? "Ostatní",
                        examDate = row.ExamDate,
                        nextExamDate = row.NextExamDate == "" ? null : row.NextExamDate,
                        result = string.IsNullOrEmpty(row.Result) ? "—" : row.Result,
                        notes = row.Notes ?? "",
                        doctorName = string.IsNullOrEmpty(row.DoctorName) ? "—" : row.DoctorName,
                        // Pořadí priorit: nahrazená perioda → "—"; deaktivovaná → "0"; jinak reálný stav.
                        status = !isNewestInGroup
                            ? "superseded"
                            : (row.LegacyIsActive == false ? "inactive" : ComputeStatus(nextExam, today))
                    };
                }).ToList();

                return Ok(new { success = true, data = resultList });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/medical/[pn]] Error");
                return StatusCode(500, new { success = false, message = "Chyba při načítání lékařských prohlídek." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateMedicalRecord([FromBody] NewMedicalRecordPayload body)
        {
            if (string.IsNullOrWhiteSpace(body.ExamTypeName)) return BadRequest(new { success = false, error = "Chybí název nebo druh prohlídky." });
            if (body.ExamDate == null) return BadRequest(new { success = false, error = "Chybí datum prohlídky." });
            if (body.AttendeePersonalNumbers == null || !body.AttendeePersonalNumbers.Any()) return BadRequest(new { success = false, error = "Chybí seznam zaměstnanců." });

            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string examTypeId = string.IsNullOrWhiteSpace(body.ExamTypeId) ? "" : body.ExamTypeId;

                if (string.IsNullOrEmpty(examTypeId))
                {
                    var existing = await connection.QueryFirstOrDefaultAsync<string>(
                        "SELECT ID FROM dbo.MEDICAL_EXAM_TYPES WHERE Name = @name", new { name = body.ExamTypeName.Trim() });

                    if (!string.IsNullOrEmpty(existing)) examTypeId = existing;
                    else
                    {
                        examTypeId = GenId("MED");
                        await connection.ExecuteAsync(@"
                            INSERT INTO dbo.MEDICAL_EXAM_TYPES (ID, Name, ValidityMonths, Category)
                            VALUES (@id, @name, @validity, @category)",
                            new { id = examTypeId, name = body.ExamTypeName.Trim(), validity = 0, category = "Ostatní" });
                    }
                }

                foreach (var pn in body.AttendeePersonalNumbers)
                {
                    string recordId = GenId("REC");
                    await connection.ExecuteAsync(@"
                        INSERT INTO dbo.MEDICAL_EXAM_RECORDS
                            (ID, ExamTypeID, EmployeePersonalNumber, ExamDate, NextExamDate, DoctorName, Result, Notes)
                        VALUES
                            (@id, @typeId, @pn, @examDate, @nextExamDate, @doctor, @result, @notes)",
                    new
                    {
                        id = recordId,
                        typeId = examTypeId,
                        pn = pn,
                        examDate = body.ExamDate,
                        nextExamDate = body.NextExamDate,
                        doctor = string.IsNullOrWhiteSpace(body.DoctorName) ? null : body.DoctorName.Trim(),
                        result = string.IsNullOrWhiteSpace(body.Result) ? "Způsobilý" : body.Result.Trim(),
                        notes = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim()
                    });
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[POST /api/medical] Error");
                return StatusCode(500, new { success = false, error = ex.Message ?? "Chyba serveru." });
            }
        }

        // Nastaví příznak aktivní/neaktivní (LegacyIsActive) u nejnovějšího záznamu dané prohlídky
        // pro každého zaměstnance. Neaktivní (0) → v profilu i katalogu se zobrazí "0".
        [HttpPut("records/set-active")]
        public async Task<IActionResult> SetMedicalRecordsActive([FromBody] SetMedicalActivePayload body)
        {
            if (string.IsNullOrWhiteSpace(body.ExamTypeId) || body.PersonalNumbers == null || !body.PersonalNumbers.Any())
                return BadRequest(new { success = false, message = "Chybí osobní čísla nebo ID prohlídky." });

            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureSchemaAsync(connection);
                if (!_hasLegacyActive)
                    return StatusCode(500, new { success = false, message = "Sloupec LegacyIsActive není k dispozici." });

                int updated = 0;
                foreach (var pn in body.PersonalNumbers.Where(p => !string.IsNullOrWhiteSpace(p)))
                {
                    updated += await connection.ExecuteAsync(@"
                        UPDATE dbo.MEDICAL_EXAM_RECORDS
                        SET LegacyIsActive = @active
                        WHERE ID = (
                            SELECT TOP 1 r.ID
                            FROM dbo.MEDICAL_EXAM_RECORDS r
                            WHERE r.EmployeePersonalNumber = @pn AND r.ExamTypeID = @tid
                            ORDER BY r.ExamDate DESC, r.ID DESC
                        )",
                        new { active = body.IsActive ? 1 : 0, pn = pn.Trim(), tid = body.ExamTypeId });
                }

                return Ok(new { success = true, updated });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[PUT /api/medical/records/set-active] Error");
                return StatusCode(500, new { success = false, message = "Změna stavu prohlídky se nezdařila." });
            }
        }

        private static string ComputeStatus(DateTime? nextExamDate, DateTime today)
        {
            if (!nextExamDate.HasValue) return "valid";
            if (nextExamDate.Value < today) return "expired";
            if (nextExamDate.Value <= today.AddDays(30)) return "expiring_soon";
            return "valid";
        }

        // Odstraní z názvu prohlídky periodu ("… po 2 letech" → "…"), aby šly seskupit varianty téže prohlídky.
        // Kotví se na konci názvu, takže varianty jako "… + EKG" zůstanou samostatné.
        private static readonly System.Text.RegularExpressions.Regex PeriodicitySuffixRegex =
            new(@"\s*po\s+\d+\s+(letech|let|roky|roku|roce|rok)\.?\s*$",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.Compiled);

        private static string StripPeriodicitySuffix(string? name) =>
            string.IsNullOrEmpty(name) ? "" : PeriodicitySuffixRegex.Replace(name, "").Trim();

        // Klíč skupiny "stejné" prohlídky – jen základní název (bez periody).
        // Kategorie se do klíče NEdává: periodické varianty mají různou kategorii (PERIODIKA_2_ROKY / 4_ROKY / 6_LET).
        private static string MedicalGroupKey(MedicalRecordDto r) =>
            StripPeriodicitySuffix(r.ExamTypeName).ToLowerInvariant();

        // Převod interního stavu na český text pro export (stejné názvosloví jako u školení).
        private static string StatusToCzech(string status) => status switch
        {
            "expired"       => "Propadlé",
            "expiring_soon" => "Blíží se expirace",
            _               => "Platné"
        };

        private static string GenId(string prefix)
        {
            return $"{prefix}-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}";
        }
    }

    public class MedicalRecordDto
    {
        public string ExamTypeId { get; set; } = string.Empty;
        public string RecordId { get; set; } = string.Empty;
        public string ExamTypeName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string ExamDate { get; set; } = string.Empty;
        public string NextExamDate { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public int PeriodicityMonths { get; set; }
        public bool? LegacyIsActive { get; set; }
    }

    public class SetMedicalActivePayload
    {
        public string? ExamTypeId { get; set; }
        public List<string>? PersonalNumbers { get; set; }
        public bool IsActive { get; set; }
    }

    public class MedicalExportRow
    {
        public string PersonalNumber { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string EmployeeCategory { get; set; } = string.Empty;
        public string CostNumber { get; set; } = string.Empty;
        public string CostNumberDesc { get; set; } = string.Empty;
        public string ExamCategory { get; set; } = string.Empty;
        public string ExamName { get; set; } = string.Empty;
        public string RecordId { get; set; } = string.Empty;
        public DateTime? CompletionDate { get; set; }
        public DateTime? ExpirationDate { get; set; }
        public int PeriodicityMonths { get; set; }
    }

    public class NewMedicalRecordPayload
    {
        public string? ExamTypeId { get; set; }
        public string? ExamTypeName { get; set; }
        public DateTime? ExamDate { get; set; }
        public DateTime? NextExamDate { get; set; }
        public List<string>? AttendeePersonalNumbers { get; set; }
        public string? DoctorName { get; set; }
        public string? Result { get; set; }
        public string? Notes { get; set; }
    }
}
