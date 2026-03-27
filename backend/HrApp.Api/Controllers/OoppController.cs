using Dapper;
using HrApp.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace HrApp.Api.Controllers
{
    [ApiController]
    [Route("api/oopp")]
    public class OoppController : ControllerBase
    {
        private readonly ISqlConnectionFactory _connectionFactory;
        private readonly ILogger<OoppController> _logger;

        public OoppController(ISqlConnectionFactory connectionFactory, ILogger<OoppController> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetOoppItems()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var result = await connection.QueryAsync("SELECT ID AS id, Name AS name, Category AS category FROM dbo.OOPP_ITEMS ORDER BY Category, Name");
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/oopp] Error");
                return StatusCode(500, new { success = false, message = "Chyba při načítání OOPP." });
            }
        }

        [HttpGet("{personalNumber}")]
        public async Task<IActionResult> GetOoppRecords(string personalNumber)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var param = new { pn = Uri.UnescapeDataString(personalNumber) };

                string sql = @"
                    SELECT
                        iss.ID                                          AS issueId,
                        i.ID                                            AS ooppItemId,
                        i.Name                                          AS ooppItemName,
                        i.Category                                      AS category,
                        CONVERT(varchar(10), iss.IssueDate, 23)         AS assignedDate,
                        CONVERT(varchar(10), iss.NextEntitlementDate, 23) AS returnedDate,
                        iss.Quantity                                    AS quantity,
                        ISNULL(iss.Size, '')                            AS assignment,
                        ISNULL(iss.Notes, '')                           AS notes
                    FROM dbo.OOPP_ISSUES iss
                    JOIN dbo.OOPP_ITEMS i ON i.ID = iss.OoppItemID
                    WHERE iss.EmployeePersonalNumber = @pn
                    ORDER BY iss.IssueDate DESC";

                var records = await connection.QueryAsync(sql, param);

                var today = DateTime.Today;
                var resultList = records.Select(row =>
                {
                    DateTime? returnedD = string.IsNullOrEmpty(row.returnedDate) ? null : DateTime.Parse(row.returnedDate);
                    
                    string status = "issued";
                    if (returnedD.HasValue)
                    {
                        if (returnedD.Value <= today) status = "eligible";
                        else if (returnedD.Value <= today.AddDays(30)) status = "eligible_soon";
                    }

                    return new
                    {
                        issueId = row.issueId,
                        ooppItemId = row.ooppItemId,
                        ooppItemName = row.ooppItemName,
                        category = string.IsNullOrEmpty(row.category) ? "Ostatní" : row.category,
                        lastIssueDate = string.IsNullOrEmpty(row.assignedDate) ? "—" : row.assignedDate,
                        nextEntitlementDate = string.IsNullOrEmpty(row.returnedDate) ? null : row.returnedDate,
                        quantity = row.quantity ?? 1,
                        size = string.IsNullOrEmpty(row.assignment) ? null : row.assignment,
                        notes = row.notes,
                        status
                    };
                }).ToList();

                return Ok(new { success = true, data = resultList });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/oopp/[pn]] Error");
                return StatusCode(500, new { success = false, message = "Chyba při načítání OOPP výdejů." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateOoppIssue([FromBody] NewOoppPayload body)
        {
            if (string.IsNullOrWhiteSpace(body.OoppItemId)) return BadRequest(new { success = false, error = "Chybí výběr OOPP pomůcky." });
            if (body.IssueDate == null) return BadRequest(new { success = false, error = "Chybí datum výdeje." });
            if (body.AttendeePersonalNumbers == null || !body.AttendeePersonalNumbers.Any()) return BadRequest(new { success = false, error = "Chybí seznam zaměstnanců." });

            try
            {
                using var connection = _connectionFactory.CreateHrConnection();

                foreach (var pn in body.AttendeePersonalNumbers)
                {
                    string id = GenId("ISS");
                    await connection.ExecuteAsync(@"
                        INSERT INTO dbo.OOPP_ISSUES (ID, OoppItemID, EmployeePersonalNumber, IssueDate, NextEntitlementDate, Quantity, Size, Notes)
                        VALUES (@id, @itemId, @pn, @issueDate, @nextDate, @quantity, @size, @notes)",
                    new
                    {
                        id = id,
                        itemId = body.OoppItemId.Trim(),
                        pn = pn,
                        issueDate = body.IssueDate,
                        nextDate = body.NextEntitlementDate,
                        quantity = body.Quantity ?? 1,
                        size = string.IsNullOrWhiteSpace(body.Size) ? null : body.Size.Trim(),
                        notes = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim()
                    });
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[POST /api/oopp] Error");
                return StatusCode(500, new { success = false, error = ex.Message ?? "Chyba serveru." });
            }
        }

        private static string GenId(string prefix)
        {
            return $"{prefix}-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 5)}";
        }
    }

    public class NewOoppPayload
    {
        public string? OoppItemId { get; set; }
        public DateTime? IssueDate { get; set; }
        public DateTime? NextEntitlementDate { get; set; }
        public int? Quantity { get; set; }
        public string? Size { get; set; }
        public string? Notes { get; set; }
        public List<string>? AttendeePersonalNumbers { get; set; }
    }
}
