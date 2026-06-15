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

        public MedicalController(ISqlConnectionFactory connectionFactory, ILogger<MedicalController> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        [HttpGet("types/{typeId}")]
        public async Task<IActionResult> GetMedicalTypeDetail(string typeId)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string tSql = "SELECT ID as id, Name as name, ValidityMonths as validityMonths, Category as category, ISNULL(MedicalFacility, '') AS medicalFacility, ISNULL(Description, '') AS description FROM dbo.MEDICAL_EXAM_TYPES WHERE ID = @tid";
                var type = await connection.QueryFirstOrDefaultAsync(tSql, new { tid = Uri.UnescapeDataString(typeId) });
                if (type == null) return NotFound(new { success = false });

                string eSql = @"
                    SELECT ISNULL(u.BIS_Jmeno, '') AS firstName, ISNULL(u.BIS_Prijmeni, '') AS lastName, ISNULL(u.BIS_Osobni_cislo, '') AS personalNumber, ISNULL(u.Oddeleni, '') AS department, e.HiringDate AS hiringDate,
                           ISNULL(CAST(u.Nakladove_Stredisko AS VARCHAR), ISNULL(e.CostNumber, '')) AS costNumber,
                           ISNULL(sp_cc.STREDISKO_POPIS, ISNULL(e.CostNumberDesc, '')) AS costNumberDesc,
                           CAST(CASE WHEN em.ExamDate IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS hasCompleted, em.ExamDate AS completionDate, em.NextExamDate AS expirationDate,
                           ISNULL(em.Notes, '') AS notes,
                           CASE WHEN em.ExamDate IS NULL THEN 'Neproškolen' WHEN em.NextExamDate < CAST(SYSDATETIME() AS DATE) THEN 'Neplatné' WHEN DATEDIFF(day, CAST(SYSDATETIME() AS DATE), em.NextExamDate) <= 30 THEN 'Blíží se expirace' ELSE 'Platné' END AS validityStatus
                    FROM (SELECT *, ROW_NUMBER() OVER(PARTITION BY BIS_Osobni_cislo ORDER BY ID DESC) AS rn FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osobni_cislo IS NOT NULL AND BIS_Aktivni = 1) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                    LEFT JOIN USER_MANAGEMENT.dbo.STREDISKO_POPIS sp_cc ON TRY_CONVERT(decimal(18,4), sp_cc.STREDISKO) = TRY_CONVERT(decimal(18,4), u.Nakladove_Stredisko)
                     OUTER APPLY (
                         SELECT TOP 1 ExamDate, NextExamDate, Notes
                         FROM dbo.MEDICAL_EXAM_RECORDS r
                         WHERE r.EmployeePersonalNumber = u.BIS_Osobni_cislo AND r.ExamTypeID = @tid
                         ORDER BY r.ExamDate DESC
                     ) em
                     WHERE u.rn = 1 AND u.BIS_Aktivni = 1
                     ORDER BY u.BIS_Prijmeni, u.BIS_Jmeno";
                var employees = await connection.QueryAsync(eSql, new { tid = Uri.UnescapeDataString(typeId) });
                return Ok(new { success = true, medicalType = type, employees = employees });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/medical/types/{typeId}] Error");
                return StatusCode(500, new { success = false });
            }
        }

        [HttpGet("export")]
        public async Task<IActionResult> GetExportData([FromQuery] string? category, [FromQuery] string? search)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();

                var conditions = new List<string> { "u.rn = 1" };
                var parameters = new DynamicParameters();

                if (!string.IsNullOrWhiteSpace(category) && category != "Vše")
                {
                    conditions.Add("mt.Category = @category");
                    parameters.Add("category", category);
                }
                if (!string.IsNullOrWhiteSpace(search))
                {
                    conditions.Add("(mt.Name LIKE @search OR mt.Category LIKE @search)");
                    parameters.Add("search", $"%{search}%");
                }

                string whereClause = "WHERE " + string.Join(" AND ", conditions);

                string sql = $@"
                    SELECT
                        ISNULL(u.BIS_Osobni_cislo, '')                                             AS personalNumber,
                        ISNULL(u.BIS_Prijmeni, '')                                                 AS lastName,
                        ISNULL(u.BIS_Jmeno, '')                                                    AS firstName,
                        ISNULL(CAST(u.Kategorie AS VARCHAR), ISNULL(e.Category, ''))               AS employeeCategory,
                        ISNULL(CAST(u.Nakladove_Stredisko AS VARCHAR), ISNULL(e.CostNumber, ''))   AS costNumber,
                        ISNULL(sp_cc.STREDISKO_POPIS, ISNULL(e.CostNumberDesc, ''))                AS costNumberDesc,
                        mt.Category                                                                AS examCategory,
                        mt.Name                                                                    AS examName,
                        em.ExamDate                                                                AS completionDate,
                        em.NextExamDate                                                            AS expirationDate,
                        mt.ValidityMonths                                                          AS periodicityMonths,
                        CASE WHEN em.ExamDate IS NULL THEN 'N'
                             WHEN em.NextExamDate < CAST(SYSDATETIME() AS DATE) THEN 'N'
                             ELSE 'A' END                                                          AS isValid
                    FROM dbo.MEDICAL_EXAM_TYPES mt
                    CROSS JOIN (
                        SELECT *, ROW_NUMBER() OVER(PARTITION BY BIS_Osobni_cislo ORDER BY ID DESC) AS rn
                        FROM USER_MANAGEMENT.dbo.USERS
                        WHERE BIS_Aktivni = 1 AND BIS_Osobni_cislo IS NOT NULL
                    ) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                    LEFT JOIN USER_MANAGEMENT.dbo.STREDISKO_POPIS sp_cc ON TRY_CONVERT(decimal(18,4), sp_cc.STREDISKO) = TRY_CONVERT(decimal(18,4), u.Nakladove_Stredisko)
                    OUTER APPLY (
                        SELECT TOP 1 ExamDate, NextExamDate
                        FROM dbo.MEDICAL_EXAM_RECORDS r
                        WHERE r.EmployeePersonalNumber = u.BIS_Osobni_cislo AND r.ExamTypeID = mt.ID
                        ORDER BY r.ExamDate DESC
                    ) em
                    {whereClause}
                    ORDER BY u.BIS_Prijmeni, u.BIS_Jmeno, mt.Category, mt.Name";

                var result = await connection.QueryAsync(sql, parameters);
                return Ok(new { success = true, data = result });
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
                var param = new { pn = Uri.UnescapeDataString(personalNumber) };

                string sql = @"
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
                        mt.ValidityMonths                              AS PeriodicityMonths
                    FROM dbo.MEDICAL_EXAM_RECORDS em
                    JOIN dbo.MEDICAL_EXAM_TYPES mt ON mt.ID = em.ExamTypeID
                    WHERE em.EmployeePersonalNumber = @pn
                    ORDER BY em.ExamDate DESC";

                var records = await connection.QueryAsync<MedicalRecordDto>(sql, param);

                var today = DateTime.Today;
                var resultList = records.Select(row =>
                {
                    DateTime? nextExam = string.IsNullOrEmpty(row.NextExamDate) ? null : DateTime.Parse(row.NextExamDate);
                    
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
                        status = ComputeStatus(nextExam, today)
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

        private static string ComputeStatus(DateTime? nextExamDate, DateTime today)
        {
            if (!nextExamDate.HasValue) return "valid";
            if (nextExamDate.Value < today) return "expired";
            if (nextExamDate.Value <= today.AddDays(30)) return "expiring_soon";
            return "valid";
        }

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
