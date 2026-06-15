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

        [HttpGet("items/{itemId}")]
        public async Task<IActionResult> GetOoppItemDetail(string itemId)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string tSql = "SELECT ID as id, Name as name, Category as category FROM dbo.OOPP_ITEMS WHERE ID = @tid";
                var item = await connection.QueryFirstOrDefaultAsync(tSql, new { tid = Uri.UnescapeDataString(itemId) });
                if (item == null) return NotFound(new { success = false });

                string eSql = @"
                    SELECT ISNULL(u.BIS_Jmeno, '') AS firstName, ISNULL(u.BIS_Prijmeni, '') AS lastName, ISNULL(u.BIS_Osobni_cislo, '') AS personalNumber, ISNULL(u.Oddeleni, '') AS department, e.HiringDate AS hiringDate,
                           CAST(CASE WHEN em.IssueDate IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS hasCompleted, em.IssueDate AS completionDate, em.NextEntitlementDate AS expirationDate,
                           em.Size as size, em.Quantity as quantity,
                           CASE WHEN em.IssueDate IS NULL THEN 'Nevydáno' WHEN em.NextEntitlementDate < CAST(SYSDATETIME() AS DATE) THEN 'Nárok' WHEN DATEDIFF(day, CAST(SYSDATETIME() AS DATE), em.NextEntitlementDate) <= 30 THEN 'Brzy nárok' ELSE 'Vydáno' END AS validityStatus
                    FROM (SELECT *, ROW_NUMBER() OVER(PARTITION BY BIS_Osobni_cislo ORDER BY ID DESC) AS rn FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osobni_cislo IS NOT NULL AND BIS_Aktivni = 1) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                     OUTER APPLY (
                         SELECT TOP 1 IssueDate, NextEntitlementDate, Size, Quantity
                         FROM dbo.OOPP_ISSUES r
                         WHERE r.EmployeePersonalNumber = u.BIS_Osobni_cislo AND r.OoppItemID = @tid
                         ORDER BY r.IssueDate DESC
                     ) em
                     WHERE u.rn = 1 AND u.BIS_Aktivni = 1
                     ORDER BY u.BIS_Prijmeni, u.BIS_Jmeno";
                var employees = await connection.QueryAsync(eSql, new { tid = Uri.UnescapeDataString(itemId) });
                return Ok(new { success = true, item = item, employees = employees });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/oopp/items/{itemId}] Error");
                return StatusCode(500, new { success = false });
            }
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

        [HttpPost("items")]
        public async Task<IActionResult> CreateOoppItem([FromBody] NewOoppItemPayload body)
        {
            if (string.IsNullOrWhiteSpace(body.Name) || string.IsNullOrWhiteSpace(body.Category)) return BadRequest(new { success = false, message = "Neplatné údaje." });
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string newId = $"OP_{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
                string sql = "INSERT INTO dbo.OOPP_ITEMS (ID, Name, Category) VALUES (@id, @name, @cat)";
                await connection.ExecuteAsync(sql, new { id = newId, name = body.Name.Trim(), cat = body.Category.Trim() });
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[POST /api/oopp/items] Error");
                return StatusCode(500, new { success = false, message = "Chyba při ukládání položky OOPP." });
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

    public class NewOoppItemPayload
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }
}
