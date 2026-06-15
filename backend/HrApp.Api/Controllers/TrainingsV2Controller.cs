using ClosedXML.Excel;
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
        private static bool _catalogSchemaChecked = false;
        private static bool _hasUmCostDescCol = false;

        public TrainingsV2Controller(ISqlConnectionFactory connectionFactory, ILogger<TrainingsV2Controller> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        private async Task EnsureCatalogSchemaAsync(System.Data.IDbConnection connection)
        {
            if (_catalogSchemaChecked) return;
            string sql = @"
                IF COL_LENGTH('dbo.TRAININGS_CATALOG', 'IsLegal') IS NULL
                    ALTER TABLE dbo.TRAININGS_CATALOG ADD IsLegal BIT NOT NULL DEFAULT 0;
                IF COL_LENGTH('dbo.TRAININGS_CATALOG', 'IsExternal') IS NULL
                    ALTER TABLE dbo.TRAININGS_CATALOG ADD IsExternal BIT NOT NULL DEFAULT 0;
                IF COL_LENGTH('dbo.TRAININGS_CATALOG', 'TrainerName') IS NULL
                    ALTER TABLE dbo.TRAININGS_CATALOG ADD TrainerName NVARCHAR(100) NULL;
                IF COL_LENGTH('HR.dbo.EMPLOYEES', 'CostNumberDesc') IS NULL
                    ALTER TABLE HR.dbo.EMPLOYEES ADD CostNumberDesc NVARCHAR(100) NULL;
                IF COL_LENGTH('dbo.TRAINING_RECORDS', 'IsLegalOrExternal') IS NULL
                    ALTER TABLE dbo.TRAINING_RECORDS ADD IsLegalOrExternal BIT NOT NULL DEFAULT 0;
            ";
            try
            {
                await connection.ExecuteAsync(sql);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not auto-update TRAININGS_CATALOG schema.");
            }
            try
            {
                var cnt = await connection.QueryFirstAsync<int>(
                    "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('USER_MANAGEMENT.dbo.USERS') AND name = 'Nakladove_Stredisko_Popis'");
                _hasUmCostDescCol = cnt > 0;
            }
            catch { }
            _catalogSchemaChecked = true;
        }

        [HttpGet]
        public async Task<IActionResult> GetTrainings()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureCatalogSchemaAsync(connection);

                string sql = @"
                    SELECT
                        t.ID                                        AS Id,
                        t.Name                                      AS Name,
                        ISNULL(t.Description, '')                   AS Description,
                        t.PeriodicityMonths                         AS PeriodicityMonths,
                        c.ID                                        AS CategoryId,
                        ISNULL(c.Name, 'Bez kategorie')             AS CategoryName,
                        CAST(ISNULL(t.IsLegal, 0) AS BIT)           AS IsLegal,
                        CAST(ISNULL(t.IsExternal, 0) AS BIT)        AS IsExternal,
                        ISNULL(t.TrainerName, '')                   AS TrainerName
                    FROM dbo.TRAININGS_CATALOG t
                    LEFT JOIN dbo.TRAINING_CATEGORIES c ON t.CategoryID = c.ID
                    ORDER BY c.Name, t.Name";

                var result = await connection.QueryAsync<TrainingDto>(sql);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/trainings-v2] Error");
                return StatusCode(500, new { success = false, message = "Error." });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTrainingDetail(int id)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureCatalogSchemaAsync(connection);

                string tSql = @"
                    SELECT t.ID as id, t.Name as name, ISNULL(t.Description,'') as description,
                           t.PeriodicityMonths as periodicityMonths, c.Name as categoryName,
                           CAST(ISNULL(t.IsLegal,0) AS BIT) as isLegal,
                           CAST(ISNULL(t.IsExternal,0) AS BIT) as isExternal,
                           ISNULL(t.TrainerName,'') as trainerName
                    FROM dbo.TRAININGS_CATALOG t
                    JOIN dbo.TRAINING_CATEGORIES c ON t.CategoryID = c.ID
                    WHERE t.ID = @tid";
                var training = await connection.QueryFirstOrDefaultAsync(tSql, new { tid = id });
                if (training == null) return NotFound(new { success = false });

                string detailCostDescFallback = _hasUmCostDescCol
                    ? "ISNULL(u.Nakladove_Stredisko_Popis, ISNULL(e.CostNumberDesc, ''))"
                    : "ISNULL(e.CostNumberDesc, '')";
                string detailCostDescExpr = $"ISNULL(sp_cc.STREDISKO_POPIS, {detailCostDescFallback})";

                string eSql = $@"
                    SELECT e.ID AS employeeId, ISNULL(u.BIS_Jmeno, '') AS firstName, ISNULL(u.BIS_Prijmeni, '') AS lastName,
                        ISNULL(u.BIS_Osobni_cislo, '') AS personalNumber, ISNULL(u.Oddeleni, '') AS department,
                        ISNULL(CAST(u.Stredisko AS VARCHAR), '') AS workcenter, e.HiringDate AS hiringDate,
                        ISNULL(CAST(u.Kategorie AS VARCHAR), ISNULL(e.Category, '')) AS category,
                        ISNULL(CAST(u.Nakladove_Stredisko AS VARCHAR), ISNULL(e.CostNumber, '')) AS costNumber,
                        {detailCostDescExpr} AS costNumberDesc,
                        CAST(ISNULL(tr.HasCompleted, 0) AS BIT) AS hasCompleted, tr.CompletionDate AS completionDate,
                        tr.ExpirationDate AS expirationDate, CAST(ISNULL(tr.IsLegalOrExternal, 0) AS BIT) AS isLegalOrExternal,
                        CASE WHEN tr.HasCompleted IS NULL THEN 'Neproškolen'
                             WHEN tr.ExpirationDate < CAST(SYSDATETIME() AS DATE) THEN 'Neplatné'
                             WHEN DATEDIFF(day, CAST(SYSDATETIME() AS DATE), tr.ExpirationDate) <= 30 THEN 'Blíží se expirace'
                             ELSE 'Platné' END AS validityStatus
                    FROM (SELECT *, ROW_NUMBER() OVER(PARTITION BY BIS_Osobni_cislo ORDER BY ID DESC) AS rn
                          FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osobni_cislo IS NOT NULL AND BIS_Aktivni = 1) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                    LEFT JOIN USER_MANAGEMENT.dbo.STREDISKO_POPIS sp_cc ON TRY_CONVERT(decimal(18,4), sp_cc.STREDISKO) = TRY_CONVERT(decimal(18,4), u.Nakladove_Stredisko)
                    OUTER APPLY (
                        SELECT TOP 1 1 AS HasCompleted, tr.CompletionDate, tr.ExpirationDate, tr.IsLegalOrExternal
                        FROM dbo.TRAINING_RECORDS tr
                        JOIN dbo.EMPLOYEES e_inner ON e_inner.ID = tr.EmployeeID
                        WHERE e_inner.PersonalNumber = u.BIS_Osobni_cislo AND tr.TrainingID = @tid
                        ORDER BY tr.CompletionDate DESC
                    ) tr
                    WHERE u.rn = 1 AND u.BIS_Aktivni = 1
                      AND tr.HasCompleted IS NOT NULL
                    ORDER BY u.BIS_Prijmeni, u.BIS_Jmeno";

                var employees = await connection.QueryAsync(eSql, new { tid = id });
                return Ok(new { success = true, training = training, employees = employees });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/trainings-v2/{id}] Error");
                return StatusCode(500, new { success = false });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateTraining([FromBody] NewTrainingPayload body)
        {
            if (string.IsNullOrWhiteSpace(body.Name) || body.CategoryId <= 0 || body.PeriodicityMonths < 0)
                return BadRequest(new { success = false, message = "Chybí povinné údaje." });
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureCatalogSchemaAsync(connection);

                string sql = @"
                    INSERT INTO dbo.TRAININGS_CATALOG (CategoryID, Name, Description, PeriodicityMonths, IsLegal, IsExternal, TrainerName)
                    VALUES (@catId, @name, @desc, @period, @isLegal, @isExternal, @trainerName)";
                await connection.ExecuteAsync(sql, new
                {
                    catId = body.CategoryId,
                    name = body.Name.Trim(),
                    desc = body.Description ?? "",
                    period = body.PeriodicityMonths,
                    isLegal = body.IsLegal,
                    isExternal = body.IsExternal,
                    trainerName = body.TrainerName?.Trim() ?? ""
                });
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[POST /api/trainings-v2] Error");
                return StatusCode(500, new { success = false });
            }
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

        [HttpGet("catalog-export")]
        public async Task<IActionResult> ExportCatalog(
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] string? isLegal,
            [FromQuery] string? isExternal)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureCatalogSchemaAsync(connection);

                var conditions = new List<string>();
                var parameters = new DynamicParameters();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    conditions.Add("(t.Name LIKE @search OR c.Name LIKE @search OR t.TrainerName LIKE @search)");
                    parameters.Add("search", $"%{search}%");
                }
                if (!string.IsNullOrWhiteSpace(category) && category != "Vše")
                {
                    conditions.Add("c.Name = @category");
                    parameters.Add("category", category);
                }
                if (isLegal == "1") conditions.Add("t.IsLegal = 1");
                else if (isLegal == "0") conditions.Add("t.IsLegal = 0");

                if (isExternal == "1") conditions.Add("t.IsExternal = 1");
                else if (isExternal == "0") conditions.Add("t.IsExternal = 0");

                string where = conditions.Any() ? "WHERE " + string.Join(" AND ", conditions) : "";

                string sql = $@"
                    SELECT
                        ISNULL(c.Name, 'Bez kategorie')     AS CategoryName,
                        t.Name                              AS Name,
                        CAST(ISNULL(t.IsLegal, 0) AS BIT)   AS IsLegal,
                        CAST(ISNULL(t.IsExternal, 0) AS BIT) AS IsExternal,
                        t.PeriodicityMonths                 AS PeriodicityMonths,
                        ISNULL(t.TrainerName, '')           AS TrainerName,
                        ISNULL(t.Description, '')           AS Description
                    FROM dbo.TRAININGS_CATALOG t
                    LEFT JOIN dbo.TRAINING_CATEGORIES c ON t.CategoryID = c.ID
                    {where}
                    ORDER BY c.Name, t.Name";

                var records = (await connection.QueryAsync(sql, parameters)).ToList();

                using var wb = new XLWorkbook();
                var ws = wb.Worksheets.Add("Katalog školení");

                string[] headers = { "Kategorie", "Název školení", "Zákonné", "Interní/Externí", "Perioda (měsíců)", "Školitel", "Poznámka" };
                for (int i = 0; i < headers.Length; i++)
                {
                    var cell = ws.Cell(1, i + 1);
                    cell.Value = headers[i];
                    cell.Style.Font.Bold = true;
                    cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#0054A6");
                    cell.Style.Font.FontColor = XLColor.White;
                    cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                }

                int row = 2;
                foreach (var r in records)
                {
                    ws.Cell(row, 1).Value = (string)(r.CategoryName ?? "");
                    ws.Cell(row, 2).Value = (string)(r.Name ?? "");
                    ws.Cell(row, 3).Value = (bool)r.IsLegal ? "Zákonné" : "Nezákonné";
                    ws.Cell(row, 4).Value = (bool)r.IsExternal ? "Externí" : "Interní";
                    ws.Cell(row, 5).Value = (int)r.PeriodicityMonths;
                    ws.Cell(row, 6).Value = (string)(r.TrainerName ?? "");
                    ws.Cell(row, 7).Value = (string)(r.Description ?? "");
                    row++;
                }

                int[] colWidths = { 22, 36, 14, 14, 16, 24, 36 };
                for (int i = 0; i < colWidths.Length; i++)
                    ws.Column(i + 1).Width = colWidths[i];

                ws.RangeUsed()?.SetAutoFilter();

                using var ms = new MemoryStream();
                wb.SaveAs(ms);
                return File(ms.ToArray(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"katalog_skoleni_{DateTime.Now:yyyy-MM-dd}.xlsx");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/trainings-v2/catalog-export] Error");
                return StatusCode(500, new { success = false, message = "Chyba při exportu katalogu." });
            }
        }

        [HttpGet("employees-export")]
        public async Task<IActionResult> ExportEmployeesTrainings()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureCatalogSchemaAsync(connection);

                string sql = $@"
                    SELECT
                        ISNULL(u.BIS_Osobni_cislo, '')              AS PersonalNumber,
                        ISNULL(u.BIS_Prijmeni, '')                  AS LastName,
                        ISNULL(u.BIS_Jmeno, '')                     AS FirstName,
                        ISNULL(e.Category, '')                      AS EmployeeCategory,
                        ISNULL(CAST(u.Nakladove_Stredisko AS VARCHAR), ISNULL(e.CostNumber, '')) AS CostNumber,
                        {(_hasUmCostDescCol ? "ISNULL(u.Nakladove_Stredisko_Popis, ISNULL(e.CostNumberDesc, ''))" : "ISNULL(e.CostNumberDesc, '')")} AS CostNumberDesc,
                        ISNULL(c.Name, 'Bez kategorie')             AS TrainingCategory,
                        t.Name                                      AS TrainingName,
                        lr.CompletionDate                           AS CompletionDate,
                        lr.ExpirationDate                           AS ExpirationDate,
                        t.PeriodicityMonths                         AS PeriodicityMonths,
                        CASE
                            WHEN lr.CompletionDate IS NULL THEN 'N'
                            WHEN t.PeriodicityMonths = 0 THEN 'A'
                            WHEN lr.ExpirationDate >= CAST(GETDATE() AS DATE) THEN 'A'
                            ELSE 'N'
                        END                                         AS IsValid
                    FROM (
                        SELECT *, ROW_NUMBER() OVER(PARTITION BY ISNULL(BIS_Osobni_cislo, CAST(ID AS NVARCHAR)) ORDER BY ID DESC) AS rn
                        FROM USER_MANAGEMENT.dbo.USERS
                        WHERE BIS_Aktivni = 1
                    ) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                    CROSS JOIN dbo.TRAININGS_CATALOG t
                    LEFT JOIN dbo.TRAINING_CATEGORIES c ON c.ID = t.CategoryID
                    OUTER APPLY (
                        SELECT TOP 1 tr.CompletionDate, tr.ExpirationDate
                        FROM dbo.TRAINING_RECORDS tr
                        JOIN HR.dbo.EMPLOYEES e2 ON e2.ID = tr.EmployeeID
                        WHERE e2.PersonalNumber = u.BIS_Osobni_cislo AND tr.TrainingID = t.ID
                        ORDER BY tr.CompletionDate DESC
                    ) lr
                    WHERE u.rn = 1
                    ORDER BY u.BIS_Prijmeni, u.BIS_Jmeno, c.Name, t.Name";

                var records = (await connection.QueryAsync(sql)).ToList();

                using var wb = new XLWorkbook();
                var ws = wb.Worksheets.Add("Školení zaměstnanců");

                string[] headers = {
                    "Os. číslo", "Příjmení", "Jméno", "Kategorie zaměstnance",
                    "Nákladové středisko číslo", "Nákladové středisko popis",
                    "Kategorie školení", "Název školení",
                    "Datum absolvování", "Datum platné do", "Perioda (měs.)", "Platné"
                };

                for (int i = 0; i < headers.Length; i++)
                {
                    var cell = ws.Cell(1, i + 1);
                    cell.Value = headers[i];
                    cell.Style.Font.Bold = true;
                    cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1e3a5f");
                    cell.Style.Font.FontColor = XLColor.White;
                    cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                }

                int row = 2;
                foreach (var r in records)
                {
                    bool isValid = (string)r.IsValid == "A";

                    ws.Cell(row, 1).Value  = (string)(r.PersonalNumber ?? "");
                    ws.Cell(row, 2).Value  = (string)(r.LastName ?? "");
                    ws.Cell(row, 3).Value  = (string)(r.FirstName ?? "");
                    ws.Cell(row, 4).Value  = (string)(r.EmployeeCategory ?? "");
                    ws.Cell(row, 5).Value  = (string)(r.CostNumber ?? "");
                    ws.Cell(row, 6).Value  = (string)(r.CostNumberDesc ?? "");
                    ws.Cell(row, 7).Value  = (string)(r.TrainingCategory ?? "");
                    ws.Cell(row, 8).Value  = (string)(r.TrainingName ?? "");

                    if (r.CompletionDate is DateTime cd)
                    {
                        ws.Cell(row, 9).Value = cd.ToString("dd.MM.yyyy");
                    }
                    if (r.ExpirationDate is DateTime ed)
                    {
                        ws.Cell(row, 10).Value = ed.ToString("dd.MM.yyyy");
                    }

                    ws.Cell(row, 11).Value = (int)r.PeriodicityMonths == 0 ? "trvalé" : $"{r.PeriodicityMonths} měs.";
                    ws.Cell(row, 12).Value = (string)r.IsValid;

                    // Červené pozadí pro neplatná / neabsolvovaná
                    if (!isValid)
                    {
                        var rowRange = ws.Range(row, 1, row, headers.Length);
                        rowRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#fff0f0");
                    }

                    row++;
                }

                int[] colWidths = { 12, 18, 16, 20, 22, 28, 20, 34, 18, 18, 14, 10 };
                for (int i = 0; i < colWidths.Length; i++)
                    ws.Column(i + 1).Width = colWidths[i];

                ws.RangeUsed()?.SetAutoFilter();
                ws.SheetView.FreezeRows(1);

                using var ms = new MemoryStream();
                wb.SaveAs(ms);
                return File(ms.ToArray(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"skoleni_zamestnancu_{DateTime.Now:yyyy-MM-dd}.xlsx");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/trainings-v2/employees-export] Error");
                return StatusCode(500, new { success = false, message = "Chyba při exportu." });
            }
        }

        [HttpPost("records")]
        public async Task<IActionResult> CreateRecord([FromBody] NewRecordPayload body)
        {
            var empIds = body.EmployeeIds != null && body.EmployeeIds.Any() ? body.EmployeeIds.Where(x => x > 0).ToList() : new List<int>();
            if (body.EmployeeId > 0 && !empIds.Contains(body.EmployeeId)) empIds.Add(body.EmployeeId);

            var pns = body.AttendeePersonalNumbers ?? new List<string>();

            if (!empIds.Any() && !pns.Any() || body.TrainingId <= 0 || body.CompletionDate == null) return BadRequest(new { success = false });

            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var training = await connection.QueryFirstOrDefaultAsync("SELECT PeriodicityMonths FROM dbo.TRAININGS_CATALOG WHERE ID = @id", new { id = body.TrainingId });

                if (training == null) return NotFound(new { success = false, message = "Školení nebylo nalezeno v katalogu." });

                int periodicity = (int)training.PeriodicityMonths;
                var expirationDate = periodicity > 0 ? body.CompletionDate.Value.AddMonths(periodicity) : body.CompletionDate.Value;

                var insertedIds = new List<int>();

                foreach (var pn in pns)
                {
                    if (string.IsNullOrWhiteSpace(pn)) continue;
                    var existingEmpId = await connection.QueryFirstOrDefaultAsync<int?>("SELECT ID FROM HR.dbo.EMPLOYEES WHERE PersonalNumber = @pn", new { pn });
                    if (existingEmpId.HasValue && existingEmpId.Value > 0)
                    {
                        if (!empIds.Contains(existingEmpId.Value)) empIds.Add(existingEmpId.Value);
                    }
                    else
                    {
                        var uInfo = await connection.QueryFirstOrDefaultAsync(@"SELECT TOP 1 BIS_Osoba_ID, BIS_Aktivni FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osobni_cislo = @pn ORDER BY ID DESC", new { pn });
                        int newEmpId = await connection.QuerySingleAsync<int>(@"
                            INSERT INTO HR.dbo.EMPLOYEES (PersonalNumber, BIS_Osoba_ID, IsActive, HiringDate)
                            OUTPUT INSERTED.ID VALUES (@pn, @osobaId, @isActive, @hiringDate)",
                            new
                            {
                                pn = pn,
                                osobaId = uInfo?.BIS_Osoba_ID,
                                isActive = uInfo?.BIS_Aktivni ?? 1,
                                hiringDate = DateTime.Now.Date
                            });
                        empIds.Add(newEmpId);
                    }
                }

                foreach (var empId in empIds)
                {
                    await connection.ExecuteAsync(
                        "DELETE FROM dbo.TRAINING_RECORDS WHERE EmployeeID = @empId AND TrainingID = @trainId",
                        new { empId, trainId = body.TrainingId });
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
        public async Task<IActionResult> GetExport([FromQuery] string filter = "all", [FromQuery] string category = "Vše", [FromQuery] string? workcenter = null)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var parameters = new DynamicParameters();
                string queryCondition = "";

                if (filter == "expiring")
                {
                    queryCondition += @"
                        AND (lr.ExpirationDate < CAST(SYSDATETIME() AS DATE) OR
                             DATEDIFF(day, CAST(SYSDATETIME() AS DATE), lr.ExpirationDate) <= 30)";
                }
                if (category != "Vše")
                {
                    queryCondition += " AND c.Name = @category";
                    parameters.Add("category", category);
                }
                if (!string.IsNullOrWhiteSpace(workcenter) && workcenter != "Vše")
                {
                    queryCondition += " AND CAST(u.Stredisko AS VARCHAR) LIKE @workcenter";
                    parameters.Add("workcenter", $"%{workcenter}%");
                }

                string sql = $@"
                    WITH LatestRecords AS (
                        SELECT r.EmployeeID, r.TrainingID, r.CompletionDate, r.ExpirationDate, r.IsLegalOrExternal,
                               ROW_NUMBER() OVER(PARTITION BY r.EmployeeID, r.TrainingID ORDER BY r.CompletionDate DESC, r.ID DESC) as rn
                        FROM dbo.TRAINING_RECORDS r
                    )
                    SELECT u.BIS_Jmeno as FirstName, u.BIS_Prijmeni as LastName, u.BIS_Osobni_cislo as PersonalNumber,
                        t.Name as TrainingName, c.Name as CategoryName, lr.CompletionDate, lr.ExpirationDate,
                        CAST(ISNULL(lr.IsLegalOrExternal, 0) AS BIT) as IsLegalOrExternal,
                        CASE WHEN lr.ExpirationDate < CAST(SYSDATETIME() AS DATE) THEN 'Prošlé'
                             WHEN DATEDIFF(day, CAST(SYSDATETIME() AS DATE), lr.ExpirationDate) <= 30 THEN 'Blíží se expirace'
                             ELSE 'Platné' END as Status
                    FROM LatestRecords lr
                    JOIN dbo.EMPLOYEES e ON lr.EmployeeID = e.ID
                    JOIN (SELECT *, ROW_NUMBER() OVER(PARTITION BY BIS_Osoba_ID ORDER BY ID DESC) as rn
                          FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osoba_ID IS NOT NULL) u
                        ON u.BIS_Osoba_ID = e.BIS_Osoba_ID AND u.rn = 1
                    JOIN dbo.TRAININGS_CATALOG t ON lr.TrainingID = t.ID
                    JOIN dbo.TRAINING_CATEGORIES c ON t.CategoryID = c.ID
                    WHERE lr.rn = 1 AND u.BIS_Aktivni = 1
                    {queryCondition}
                    ORDER BY lr.ExpirationDate ASC, u.BIS_Prijmeni, u.BIS_Jmeno";

                var records = await connection.QueryAsync(sql, parameters);

                var csv = new System.Text.StringBuilder();
                csv.AppendLine("Příjmení a jméno;Osobní číslo;Název školení;Kategorie;Zákonné / Externí;Datum absolvování;Datum platnosti;Stav");
                foreach (var r in records)
                {
                    string fullName = $"{r.LastName} {r.FirstName}";
                    csv.AppendLine($"{fullName};{r.PersonalNumber};{r.TrainingName};{r.CategoryName};{(r.IsLegalOrExternal ? "Ano" : "Ne")};{FormatDate(r.CompletionDate)};{FormatDate(r.ExpirationDate)};{r.Status}");
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

        [HttpGet("{id:int}/employees-for-record")]
        public async Task<IActionResult> GetEmployeesForRecordByStatus(int id)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureCatalogSchemaAsync(connection);

                string detailCostDescFallback = _hasUmCostDescCol
                    ? "ISNULL(u.Nakladove_Stredisko_Popis, ISNULL(e.CostNumberDesc, ''))"
                    : "ISNULL(e.CostNumberDesc, '')";
                string detailCostDescExpr = $"ISNULL(sp_cc.STREDISKO_POPIS, {detailCostDescFallback})";

                string sql = $@"
                    SELECT e.ID AS employeeId, ISNULL(u.BIS_Jmeno, '') AS firstName, ISNULL(u.BIS_Prijmeni, '') AS lastName,
                        ISNULL(u.BIS_Osobni_cislo, '') AS personalNumber, ISNULL(u.Oddeleni, '') AS department,
                        ISNULL(CAST(u.Stredisko AS VARCHAR), '') AS workcenter, e.HiringDate AS hiringDate,
                        ISNULL(CAST(u.Kategorie AS VARCHAR), ISNULL(e.Category, '')) AS category,
                        ISNULL(CAST(u.Nakladove_Stredisko AS VARCHAR), ISNULL(e.CostNumber, '')) AS costNumber,
                        {detailCostDescExpr} AS costNumberDesc,
                        CAST(ISNULL(tr.HasCompleted, 0) AS BIT) AS hasCompleted, tr.CompletionDate AS completionDate,
                        tr.ExpirationDate AS expirationDate, CAST(ISNULL(tr.IsLegalOrExternal, 0) AS BIT) AS isLegalOrExternal,
                        CASE WHEN tr.HasCompleted IS NULL THEN 'Neproškolen'
                             WHEN tr.ExpirationDate < CAST(SYSDATETIME() AS DATE) THEN 'Neplatné'
                             WHEN DATEDIFF(day, CAST(SYSDATETIME() AS DATE), tr.ExpirationDate) <= 30 THEN 'Blíží se expirace'
                             ELSE 'Platné' END AS validityStatus
                    FROM (SELECT *, ROW_NUMBER() OVER(PARTITION BY BIS_Osobni_cislo ORDER BY ID DESC) AS rn
                          FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osobni_cislo IS NOT NULL AND BIS_Aktivni = 1) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                    LEFT JOIN USER_MANAGEMENT.dbo.STREDISKO_POPIS sp_cc ON TRY_CONVERT(decimal(18,4), sp_cc.STREDISKO) = TRY_CONVERT(decimal(18,4), u.Nakladove_Stredisko)
                    OUTER APPLY (
                        SELECT TOP 1 1 AS HasCompleted, tr.CompletionDate, tr.ExpirationDate, tr.IsLegalOrExternal
                        FROM dbo.TRAINING_RECORDS tr
                        JOIN dbo.EMPLOYEES e_inner ON e_inner.ID = tr.EmployeeID
                        WHERE e_inner.PersonalNumber = u.BIS_Osobni_cislo AND tr.TrainingID = @tid
                        ORDER BY tr.CompletionDate DESC
                    ) tr
                    WHERE u.rn = 1 AND u.BIS_Aktivni = 1
                      AND CAST(u.Kategorie AS VARCHAR) IN ('11','12','31','41')
                      AND ISNULL(CAST(u.Stredisko AS VARCHAR),'') NOT IN ('722','10001','882')
                    ORDER BY u.BIS_Prijmeni, u.BIS_Jmeno";

                var employees = await connection.QueryAsync(sql, new { tid = id });
                return Ok(new { success = true, employees = employees });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/trainings-v2/{id}/employees-for-record] Error");
                return StatusCode(500, new { success = false });
            }
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedSampleData()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureCatalogSchemaAsync(connection);

                string sql = @"
                    IF NOT EXISTS (SELECT 1 FROM dbo.TRAINING_CATEGORIES WHERE Name = 'BOZP') INSERT INTO dbo.TRAINING_CATEGORIES (Name) VALUES ('BOZP');
                    IF NOT EXISTS (SELECT 1 FROM dbo.TRAINING_CATEGORIES WHERE Name = 'Kvalita') INSERT INTO dbo.TRAINING_CATEGORIES (Name) VALUES ('Kvalita');
                    DECLARE @catId INT = (SELECT TOP 1 ID FROM dbo.TRAINING_CATEGORIES WHERE Name = 'BOZP');
                    IF NOT EXISTS (SELECT 1 FROM dbo.TRAININGS_CATALOG WHERE Name = 'Základní školení BOZP')
                        INSERT INTO dbo.TRAININGS_CATALOG (CategoryID, Name, Description, PeriodicityMonths, IsLegal, IsExternal, TrainerName)
                        VALUES (@catId, 'Základní školení BOZP', 'Povinné BOZP školení.', 24, 1, 0, '');";
                await connection.ExecuteAsync(sql);

                var firstEmp = await connection.QueryFirstOrDefaultAsync("SELECT ID FROM dbo.EMPLOYEES WHERE IsActive = 1");
                var firstTrn = await connection.QueryFirstOrDefaultAsync("SELECT ID FROM dbo.TRAININGS_CATALOG WHERE Name = 'Základní školení BOZP'");

                if (firstEmp != null && firstTrn != null)
                {
                    string sqlRecord = @"
                        IF NOT EXISTS (SELECT 1 FROM dbo.TRAINING_RECORDS WHERE EmployeeID = @eid AND TrainingID = @tid)
                        INSERT INTO dbo.TRAINING_RECORDS (EmployeeID, TrainingID, CompletionDate, ExpirationDate, IsLegalOrExternal)
                        VALUES (@eid, @tid, DATEADD(month, -1, SYSDATETIME()), DATEADD(month, 23, SYSDATETIME()), 1);";
                    await connection.ExecuteAsync(sqlRecord, new { eid = firstEmp.ID, tid = firstTrn.ID });
                }

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
        public bool IsLegal { get; set; }
        public bool IsExternal { get; set; }
        public string TrainerName { get; set; } = string.Empty;
    }

    public class NewTrainingPayload
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int PeriodicityMonths { get; set; }
        public string? Description { get; set; }
        public bool IsLegal { get; set; }
        public bool IsExternal { get; set; }
        public string? TrainerName { get; set; }
    }

    public class NewRecordPayload
    {
        public List<int>? EmployeeIds { get; set; }
        public List<string>? AttendeePersonalNumbers { get; set; }
        public int EmployeeId { get; set; }
        public int TrainingId { get; set; }
        public DateTime? CompletionDate { get; set; }
        public bool? IsLegalOrExternal { get; set; }
    }
}
