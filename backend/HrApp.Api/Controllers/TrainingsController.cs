using Dapper;
using HrApp.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace HrApp.Api.Controllers
{
    [ApiController]
    [Route("api/trainings")]
    public class TrainingsController : ControllerBase
    {
        private readonly ISqlConnectionFactory _connectionFactory;
        private readonly ILogger<TrainingsController> _logger;

        public TrainingsController(ISqlConnectionFactory connectionFactory, ILogger<TrainingsController> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        [HttpGet("{personalNumber}")]
        public async Task<IActionResult> GetEmployeeTrainings(string personalNumber)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var param = new { pn = Uri.UnescapeDataString(personalNumber) };

                string sql = @"
                    SELECT
                        r.ID                                            AS sessionId,
                        t.ID                                            AS trainingId,
                        t.Name                                          AS trainingName,
                        c.Name                                          AS category,
                        t.PeriodicityMonths                             AS periodicityMonths,
                        CONVERT(varchar(10), r.CompletionDate, 23)      AS completedDate,
                        CONVERT(varchar(10), r.ExpirationDate, 23)      AS expirationDate,
                        'Autorizovaný lektor ZF'                        AS trainerName,
                        ''                                              AS statusOverride,
                        ''                                              AS notes
                    FROM dbo.TRAINING_RECORDS r
                    JOIN dbo.TRAININGS_CATALOG t ON t.ID = r.TrainingID
                    JOIN dbo.TRAINING_CATEGORIES c ON c.ID = t.CategoryID
                    JOIN dbo.EMPLOYEES e ON e.ID = r.EmployeeID
                    WHERE e.PersonalNumber = @pn
                    ORDER BY r.CompletionDate DESC, r.ID ASC";

                var records = await connection.QueryAsync(sql, param);

                var today = DateTime.Today;
                var resultList = records.Select(row =>
                {
                    DateTime? expDate = row.periodicityMonths > 0 && !string.IsNullOrEmpty(row.expirationDate) ? DateTime.Parse(row.expirationDate) : null;
                    
                    string status = "valid";
                    if (expDate.HasValue)
                    {
                        if (expDate.Value < today) status = "expired";
                        else if (expDate.Value <= today.AddDays(30)) status = "expiring_soon";
                    }

                    if (!string.IsNullOrEmpty(row.statusOverride) && row.statusOverride.ToLower() != "absolvoval")
                    {
                        status = "expired";
                    }

                    return new
                    {
                        trainingId = row.trainingId,
                        sessionId = row.sessionId,
                        trainingName = row.trainingName,
                        category = row.category,
                        completedDate = row.completedDate,
                        expirationDate = expDate.HasValue ? row.expirationDate : null,
                        trainerName = string.IsNullOrEmpty(row.trainerName) ? "—" : row.trainerName,
                        notes = row.notes ?? "",
                        status = status
                    };
                }).ToList();

                return Ok(new { success = true, data = resultList });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/trainings/[pn]] Error");
                return StatusCode(500, new { success = false, message = "Chyba DB." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateLegacyTraining([FromBody] LegacyTrainingPayload body)
        {
            if (string.IsNullOrWhiteSpace(body.TrainingName)) return BadRequest(new { success = false, error = "Chybí název školení." });
            if (body.CompletedDate == null) return BadRequest(new { success = false, error = "Chybí datum absolvování." });
            if (body.ExpirationDate == null) return BadRequest(new { success = false, error = "Chybí datum expirace." });
            if (body.AttendeePersonalNumbers == null || !body.AttendeePersonalNumbers.Any()) return BadRequest(new { success = false, error = "Chybí seznam zaměstnanců." });

            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var trainingId = await connection.QueryFirstOrDefaultAsync<string>("SELECT ID FROM dbo.TRAININGS WHERE Name = @name", new { name = body.TrainingName.Trim() });

                if (string.IsNullOrEmpty(trainingId))
                {
                    var validityMonths = Math.Max(0, (body.ExpirationDate.Value.Year - body.CompletedDate.Value.Year) * 12 + body.ExpirationDate.Value.Month - body.CompletedDate.Value.Month);
                    trainingId = GenId("TRN");
                    var category = string.IsNullOrWhiteSpace(body.Category) ? "Ostatní" : body.Category;
                    
                    await connection.ExecuteAsync(@"
                        INSERT INTO dbo.TRAININGS (ID, Name, Category, ValidityMonths, IsMandatory)
                        VALUES (@id, @name, @category, @validity, @mandatory)",
                        new { id = trainingId, name = body.TrainingName.Trim(), category, validity = validityMonths, mandatory = false });
                }

                string sessionId = GenId("SES");
                await connection.ExecuteAsync(@"
                    INSERT INTO dbo.TRAINING_SESSIONS (ID, TrainingID, SessionDate, TrainerName, Notes)
                    VALUES (@id, @trainingId, @sessionDate, @trainer, @notes)",
                    new { id = sessionId, trainingId, sessionDate = body.CompletedDate, trainer = body.TrainerName?.Trim(), notes = body.Notes?.Trim() });

                foreach (var pn in body.AttendeePersonalNumbers)
                {
                    await connection.ExecuteAsync(@"
                        INSERT INTO dbo.TRAINING_ATTENDEES (SessionID, PersonalNumber, Status, ExpirationDateOverride)
                        VALUES (@sessionId, @pn, @status, @expDate)",
                        new { sessionId, pn, status = "Absolvoval", expDate = body.ExpirationDate });
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Legacy training error");
                return StatusCode(500, new { success = false, error = "Error server" });
            }
        }

        private static string GenId(string prefix)
        {
            return $"{prefix}-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0,5)}";
        }

        public class LegacyTrainingPayload
        {
            public string? TrainingName { get; set; }
            public string? Category { get; set; }
            public DateTime? CompletedDate { get; set; }
            public DateTime? ExpirationDate { get; set; }
            public List<string>? AttendeePersonalNumbers { get; set; }
            public string? TrainerName { get; set; }
            public string? Notes { get; set; }
        }
    }
}
