using Dapper;
using HrApp.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace HrApp.Api.Controllers
{
    [ApiController]
    [Route("api/iluo")]
    public class IluoController : ControllerBase
    {
        private readonly ISqlConnectionFactory _connectionFactory;
        private readonly ILogger<IluoController> _logger;

        public IluoController(ISqlConnectionFactory connectionFactory, ILogger<IluoController> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetIluoSummary()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string sql = @"
                    SELECT 
                        e.ID as Id, 
                        e.PersonalNumber as PersonalNumber, 
                        e.FirstName as FirstName, 
                        e.LastName as LastName, 
                        e.Department as Department,
                        (SELECT COUNT(*) FROM dbo.ILUO_ASSESSMENTS a WHERE a.EmployeePersonalNumber = e.PersonalNumber) as SkillCount,
                        (SELECT COUNT(*) FROM dbo.ILUO_ASSESSMENTS a WHERE a.EmployeePersonalNumber = e.PersonalNumber AND a.Level = 'O') as ExpertLevelCount
                    FROM dbo.EMPLOYEES e
                    WHERE e.IsActive = 1
                    ORDER BY e.LastName, e.FirstName";

                var summary = await connection.QueryAsync(sql);
                return Ok(new { success = true, data = summary });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/iluo/summary] Error");
                return StatusCode(500, new { success = false, message = "Database error" });
            }
        }

        [HttpGet("{personalNumber}")]
        public async Task<IActionResult> GetIluoRecords(string personalNumber)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var param = new { pn = Uri.UnescapeDataString(personalNumber) };

                string sql = @"
                    SELECT
                        a.ID                                        AS AssessmentId,
                        s.ID                                        AS SkillId,
                        s.Name                                      AS SkillName,
                        s.Category                                  AS Category,
                        w.WORKCENTER                                AS WorkCenterId,
                        ISNULL('(FRY) ' + w.WC_DESC, '')            AS WorkCenterName,
                        a.Level                                     AS CurrentLevel,
                        a.TargetLevel                               AS TargetLevel,
                        CONVERT(varchar(10), a.AssessmentDate, 23)  AS AssessmentDate,
                        CONVERT(varchar(10), a.NextReviewDate, 23)  AS NextReviewDate,
                        ISNULL(a.AssessorName, '—')                 AS AssessorName,
                        ISNULL(a.Notes, '')                         AS Notes
                    FROM dbo.ILUO_ASSESSMENTS a
                    JOIN dbo.ILUO_SKILLS s ON s.ID = a.SkillID
                    JOIN FRYaddpm.dbo.WORKCENTERS w ON w.WORKCENTER = s.WorkCenterID
                    WHERE a.EmployeePersonalNumber = @pn
                    ORDER BY a.AssessmentDate DESC";

                var records = await connection.QueryAsync(sql, param);

                var resultList = records.Select(row => new
                {
                    assessmentId = row.AssessmentId.ToString(),
                    skillId = row.SkillId.ToString(),
                    skillName = row.SkillName,
                    workCenterId = row.WorkCenterId.ToString(),
                    workCenterName = row.WorkCenterName,
                    category = string.IsNullOrEmpty(row.Category) ? "Výrobní" : row.Category,
                    currentLevel = row.CurrentLevel,
                    targetLevel = row.TargetLevel,
                    assessmentDate = row.AssessmentDate,
                    assessorName = row.AssessorName,
                    nextReviewDate = string.IsNullOrEmpty(row.NextReviewDate) ? null : row.NextReviewDate,
                    notes = row.Notes
                }).ToList();

                return Ok(new { success = true, data = resultList });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/iluo/[pn]] Error");
                return StatusCode(500, new { success = false, message = "Database error" });
            }
        }

        [HttpPatch("{personalNumber}")]
        public async Task<IActionResult> UpdateIluoRecord(string personalNumber, [FromBody] UpdateIluoPayload body)
        {
            if (string.IsNullOrEmpty(body.AssessmentId) || string.IsNullOrEmpty(body.NewLevel))
            {
                return BadRequest(new { success = false, error = "Missing required fields" });
            }

            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string sql = @"
                    UPDATE dbo.ILUO_ASSESSMENTS
                    SET Level = @level, AssessmentDate = @date
                    WHERE ID = @id";

                await connection.ExecuteAsync(sql, new { id = body.AssessmentId, level = body.NewLevel, date = DateTime.Today });
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[PATCH /api/iluo/[pn]] Error");
                return StatusCode(500, new { success = false, error = "Database error" });
            }
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedIluoData()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string sql = @"
                    IF NOT EXISTS (SELECT 1 FROM dbo.ILUO_SKILLS WHERE Name = 'Obsluha VZV') 
                        INSERT INTO dbo.ILUO_SKILLS (Name, Category, WorkCenterID) VALUES ('Obsluha VZV', 'Logistika', (SELECT TOP 1 WORKCENTER FROM FRYaddpm.dbo.WORKCENTERS));
                    IF NOT EXISTS (SELECT 1 FROM dbo.ILUO_SKILLS WHERE Name = 'Montáž motorů') 
                        INSERT INTO dbo.ILUO_SKILLS (Name, Category, WorkCenterID) VALUES ('Montáž motorů', 'Výroba', (SELECT TOP 1 WORKCENTER FROM FRYaddpm.dbo.WORKCENTERS));";
                await connection.ExecuteAsync(sql);
                return Ok(new { success = true });
            }
            catch (Exception) { return StatusCode(500, new { success = false }); }
        }
    }

    public class UpdateIluoPayload
    {
        public string AssessmentId { get; set; } = string.Empty;
        public string NewLevel { get; set; } = string.Empty;
    }
}
