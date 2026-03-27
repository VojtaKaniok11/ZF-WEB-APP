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
            return $"{prefix}-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 5)}";
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
