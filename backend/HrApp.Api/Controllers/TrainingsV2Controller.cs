using Dapper;
using HrApp.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace HrApp.Api.Controllers
{
    [ApiController]
    [Route("api/trainings-v2")]
    public class TrainingsV2Controller : ControllerBase
    {
        private readonly ISqlConnectionFactory _connectionFactory;
        private readonly ILogger<TrainingsV2Controller> _logger;

        public TrainingsV2Controller(ISqlConnectionFactory connectionFactory, ILogger<TrainingsV2Controller> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetTrainings()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string sql = @"
                    SELECT 
                        t.ID as Id, t.Name as Name, t.Description as Description,
                        t.PeriodicityMonths as PeriodicityMonths, c.ID as CategoryId, ISNULL(c.Name, 'Bez kategorie') as CategoryName
                    FROM dbo.TRAININGS_CATALOG t LEFT JOIN dbo.TRAINING_CATEGORIES c ON t.CategoryID = c.ID
                    ORDER BY c.Name, t.Name";
                var result = await connection.QueryAsync<TrainingDto>(sql);
                return Ok(new { success = true, data = result });
            }
            catch (Exception) { return StatusCode(500, new { success = false, message = "Error." }); }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTrainingDetail(int id)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string tSql = "SELECT t.ID as id, t.Name as name, t.Description as description, t.PeriodicityMonths as periodicityMonths, c.Name as categoryName FROM dbo.TRAININGS_CATALOG t JOIN dbo.TRAINING_CATEGORIES c ON t.CategoryID = c.ID WHERE t.ID = @tid";
                var training = await connection.QueryFirstOrDefaultAsync(tSql, new { tid = id });
                if (training == null) return NotFound(new { success = false });

                string eSql = @"
                    SELECT e.ID AS employeeId, ISNULL(u.BIS_Jmeno, '') AS firstName, ISNULL(u.BIS_Prijmeni, '') AS lastName, ISNULL(u.BIS_Osobni_cislo, '') AS personalNumber, ISNULL(u.Oddeleni, '') AS department, CAST(ISNULL(tr.HasCompleted, 0) AS BIT) AS hasCompleted, tr.CompletionDate AS completionDate, tr.ExpirationDate AS expirationDate, CAST(ISNULL(tr.IsLegalOrExternal, 0) AS BIT) AS isLegalOrExternal,
                        CASE WHEN tr.HasCompleted IS NULL THEN 'Neproškolen' WHEN tr.ExpirationDate < CAST(SYSDATETIME() AS DATE) THEN 'Neplatné' WHEN DATEDIFF(day, CAST(SYSDATETIME() AS DATE), tr.ExpirationDate) <= 30 THEN 'Blíží se expirace' ELSE 'Platné' END AS validityStatus
                    FROM (SELECT *, ROW_NUMBER() OVER(PARTITION BY BIS_Osobni_cislo ORDER BY ID DESC) AS rn FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osobni_cislo IS NOT NULL AND Aktivni = 1) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                     OUTER APPLY (
                         SELECT TOP 1 1 AS HasCompleted, tr.CompletionDate, tr.ExpirationDate, tr.IsLegalOrExternal 
                         FROM dbo.TRAINING_RECORDS tr
                         JOIN dbo.EMPLOYEES e_inner ON e_inner.ID = tr.EmployeeID
                         WHERE e_inner.PersonalNumber = u.BIS_Osobni_cislo AND tr.TrainingID = @tid
                         ORDER BY tr.CompletionDate DESC
                     ) tr
                     WHERE u.rn = 1 AND u.Aktivni = 1
                     ORDER BY u.BIS_Prijmeni, u.BIS_Jmeno";
                var employees = await connection.QueryAsync(eSql, new { tid = id });
                return Ok(new { success = true, training = training, employees = employees });
            }
            catch (Exception) { return StatusCode(500, new { success = false }); }
        }

        [HttpPost]
        public async Task<IActionResult> CreateTraining([FromBody] NewTrainingPayload body)
        {
            if (string.IsNullOrWhiteSpace(body.Name) || body.CategoryId <= 0 || body.PeriodicityMonths <= 0) return BadRequest(new { success = false });
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string sql = "INSERT INTO dbo.TRAININGS_CATALOG (CategoryID, Name, Description, PeriodicityMonths) VALUES (@catId, @name, @desc, @period)";
                await connection.ExecuteAsync(sql, new { catId = body.CategoryId, name = body.Name.Trim(), desc = body.Description ?? "", period = body.PeriodicityMonths });
                return Ok(new { success = true });
            }
            catch (Exception) { return StatusCode(500, new { success = false }); }
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var result = await connection.QueryAsync("SELECT ID AS id, Name AS name FROM dbo.TRAINING_CATEGORIES ORDER BY Name");
                return Ok(new { success = true, data = result });
            }
            catch (Exception) { return StatusCode(500, new { success = false }); }
        }

        [HttpPost("records")]
        public async Task<IActionResult> CreateRecord([FromBody] NewRecordPayload body)
        {
            var empIds = body.EmployeeIds != null && body.EmployeeIds.Any() ? body.EmployeeIds : new List<int> { body.EmployeeId };
            if (!empIds.Any() || body.TrainingId <= 0 || body.CompletionDate == null) return BadRequest(new { success = false });

            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var training = await connection.QueryFirstOrDefaultAsync("SELECT PeriodicityMonths FROM dbo.TRAININGS_CATALOG WHERE ID = @id", new { id = body.TrainingId });
                
                if (training == null) return NotFound(new { success = false, message = "Školení nebylo nalezeno v katalogu." });

                int periodicity = (int)training.PeriodicityMonths;
                var expirationDate = periodicity > 0 ? body.CompletionDate.Value.AddMonths(periodicity) : body.CompletionDate.Value;
                
                var insertedIds = new List<int>();

                foreach(var empId in empIds)
                {
                    int id = await connection.QuerySingleAsync<int>(@"
                        INSERT INTO dbo.TRAINING_RECORDS (EmployeeID, TrainingID, CompletionDate, ExpirationDate, IsLegalOrExternal) 
                        OUTPUT INSERTED.ID VALUES (@empId, @trainId, @compDate, @expDate, @isExt)",
                        new { empId = empId, trainId = body.TrainingId, compDate = body.CompletionDate.Value, expDate = expirationDate, isExt = body.IsLegalOrExternal ?? false });
                    insertedIds.Add(id);
                }
                return Ok(new { success = true, recordIds = insertedIds });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[POST /api/trainings-v2/records] Error saving records");
                return StatusCode(500, new { success = false, message = "Interní chyba serveru při ukládání záznamů." });
            }
        }
        [HttpGet("export")]
        public async Task<IActionResult> GetExport([FromQuery] string filter = "all", [FromQuery] string category = "Vše")
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var parameters = new DynamicParameters();
                string queryCondition = "";

                if (filter == "expiring")
                {
                    queryCondition += @"
                        AND (
                            lr.ExpirationDate < CAST(SYSDATETIME() AS DATE) OR
                            DATEDIFF(day, CAST(SYSDATETIME() AS DATE), lr.ExpirationDate) <= 30
                        )
                    ";
                }

                if (category != "Vše")
                {
                    queryCondition += " AND c.Name = @category";
                    parameters.Add("category", category);
                }

                string sql = $@"
                    WITH LatestRecords AS (
                        SELECT 
                            r.EmployeeID,
                            r.TrainingID,
                            r.CompletionDate,
                            r.ExpirationDate,
                            r.IsLegalOrExternal,
                            ROW_NUMBER() OVER(PARTITION BY r.EmployeeID, r.TrainingID ORDER BY r.CompletionDate DESC, r.ID DESC) as rn
                        FROM dbo.TRAINING_RECORDS r
                    )
                    SELECT 
                        u.BIS_Jmeno as FirstName,
                        u.BIS_Prijmeni as LastName,
                        u.BIS_Osobni_cislo as PersonalNumber,
                        t.Name as TrainingName,
                        c.Name as CategoryName,
                        lr.CompletionDate,
                        lr.ExpirationDate,
                        CAST(ISNULL(lr.IsLegalOrExternal, 0) AS BIT) as IsLegalOrExternal,
                        CASE
                            WHEN lr.ExpirationDate < CAST(SYSDATETIME() AS DATE) THEN 'Prošlé'
                            WHEN DATEDIFF(day, CAST(SYSDATETIME() AS DATE), lr.ExpirationDate) <= 30 THEN 'Blíží se expirace'
                            ELSE 'Platné'
                        END as Status
                    FROM LatestRecords lr
                    JOIN dbo.EMPLOYEES e ON lr.EmployeeID = e.ID
                    JOIN (
                        SELECT *, ROW_NUMBER() OVER(PARTITION BY BIS_Osoba_ID ORDER BY ID DESC) as rn
                        FROM USER_MANAGEMENT.dbo.USERS
                        WHERE BIS_Osoba_ID IS NOT NULL
                    ) u ON u.BIS_Osoba_ID = e.BIS_Osoba_ID AND u.rn = 1
                    JOIN dbo.TRAININGS_CATALOG t ON lr.TrainingID = t.ID
                    JOIN dbo.TRAINING_CATEGORIES c ON t.CategoryID = c.ID
                    WHERE lr.rn = 1 AND u.Aktivni = 1
                    {queryCondition}
                    ORDER BY lr.ExpirationDate ASC, u.BIS_Prijmeni, u.BIS_Jmeno";

                var records = await connection.QueryAsync(sql, parameters);

                var csv = new System.Text.StringBuilder();
                csv.AppendLine("Příjmení a jméno;Osobní číslo;Název školení;Kategorie;Zákonné / Externí;Datum absolvování;Datum platnosti;Stav");

                foreach (var row in records)
                {
                    string fullName = $"{row.LastName} {row.FirstName}";
                    csv.AppendLine($"{fullName};{row.PersonalNumber};{row.TrainingName};{row.CategoryName};{(row.IsLegalOrExternal ? "Ano" : "Ne")};{FormatDate(row.CompletionDate)};{FormatDate(row.ExpirationDate)};{row.Status}");
                }

                var bytes = System.Text.Encoding.UTF8.GetPreamble().Concat(System.Text.Encoding.UTF8.GetBytes(csv.ToString())).ToArray();
                return File(bytes, "text/csv", $"skoleni_export_{filter}.csv");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/trainings-v2/export] Error");
                return StatusCode(500, new { success = false, message = "Chyba při exportu dat." });
            }
        }

        private static string FormatDate(object? date)
        {
            if (date == null) return "";
            if (date is DateTime dt) return dt.ToString("dd.MM.yyyy");
            return "";
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedSampleData()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string sql = @"
                    IF NOT EXISTS (SELECT 1 FROM dbo.TRAINING_CATEGORIES WHERE Name = 'BOZP') INSERT INTO dbo.TRAINING_CATEGORIES (Name) VALUES ('BOZP');
                    IF NOT EXISTS (SELECT 1 FROM dbo.TRAINING_CATEGORIES WHERE Name = 'Kvalita') INSERT INTO dbo.TRAINING_CATEGORIES (Name) VALUES ('Kvalita');
                    DECLARE @catId INT = (SELECT TOP 1 ID FROM dbo.TRAINING_CATEGORIES WHERE Name = 'BOZP');
                    IF NOT EXISTS (SELECT 1 FROM dbo.TRAININGS_CATALOG WHERE Name = 'Základní školení BOZP')
                        INSERT INTO dbo.TRAININGS_CATALOG (CategoryID, Name, Description, PeriodicityMonths) VALUES (@catId, 'Základní školení BOZP', 'Povinné BOZP školení.', 24);";
                await connection.ExecuteAsync(sql);
                return Ok(new { success = true });
            }
            catch (Exception) { return StatusCode(500, new { success = false }); }
        }
    }

    public class TrainingDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PeriodicityMonths { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
    }

    public class NewTrainingPayload
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int PeriodicityMonths { get; set; }
        public string? Description { get; set; }
    }

    public class NewRecordPayload
    {
        public List<int>? EmployeeIds { get; set; }
        public int EmployeeId { get; set; }
        public int TrainingId { get; set; }
        public DateTime? CompletionDate { get; set; }
        public bool? IsLegalOrExternal { get; set; }
    }
}
