using Dapper;
using HrApp.Api.Data;
using HrApp.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace HrApp.Api.Controllers
{
    [ApiController]
    [Route("api/employees")]
    public class EmployeesController : ControllerBase
    {
        private readonly ISqlConnectionFactory _connectionFactory;
        private readonly ILogger<EmployeesController> _logger;
        private static bool _schemaChecked = false;

        public EmployeesController(ISqlConnectionFactory connectionFactory, ILogger<EmployeesController> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        private async Task EnsureSchemaAsync(System.Data.IDbConnection connection)
        {
            if (_schemaChecked) return;
            
            string sql = @"
                IF COL_LENGTH('HR.dbo.EMPLOYEES', 'Category') IS NULL
                    ALTER TABLE HR.dbo.EMPLOYEES ADD Category NVARCHAR(50) NULL;
                IF COL_LENGTH('HR.dbo.EMPLOYEES', 'CostNumber') IS NULL
                    ALTER TABLE HR.dbo.EMPLOYEES ADD CostNumber NVARCHAR(50) NULL;
                IF COL_LENGTH('HR.dbo.EMPLOYEES', 'WorkcenterDesc') IS NULL
                    ALTER TABLE HR.dbo.EMPLOYEES ADD WorkcenterDesc NVARCHAR(100) NULL;
                IF COL_LENGTH('HR.dbo.EMPLOYEES', 'LeavingDate') IS NULL
                    ALTER TABLE HR.dbo.EMPLOYEES ADD LeavingDate DATETIME NULL;
            ";
            try 
            {
                await connection.ExecuteAsync(sql);
                _schemaChecked = true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not auto-update schema. Missing columns might cause query failures.");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetEmployees([FromQuery] string? search, [FromQuery] string? cat, [FromQuery] string? wc, [FromQuery] string? wcd, [FromQuery] string? active)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureSchemaAsync(connection);

                var conditions = new List<string>();
                var parameters = new DynamicParameters();

                // Active filter: default = only active; "all" = both; "no" = only inactive (max 5 years)
                // Always exclude inactive employees who left more than 5 years ago
                conditions.Add("(u.BIS_Aktivni = 1 OR e.LeavingDate IS NULL OR e.LeavingDate >= DATEADD(year, -5, GETDATE()))");

                if (active == "all")
                    { /* show active + recently inactive */ }
                else if (active == "no")
                    conditions.Add("u.BIS_Aktivni = 0");
                else
                    conditions.Add("u.BIS_Aktivni = 1");

                if (!string.IsNullOrWhiteSpace(search))
                {
                    conditions.Add("(u.BIS_Jmeno LIKE @search OR u.BIS_Prijmeni LIKE @search OR u.BIS_Osobni_cislo LIKE @search OR u.User_Name LIKE @search)");
                    parameters.Add("search", $"%{search}%");
                }

                if (!string.IsNullOrWhiteSpace(cat))
                {
                    conditions.Add("e.Category = @cat");
                    parameters.Add("cat", cat);
                }

                if (!string.IsNullOrWhiteSpace(wc))
                {
                    conditions.Add("CAST(u.Stredisko AS VARCHAR) LIKE @wc");
                    parameters.Add("wc", $"%{wc}%");
                }

                if (!string.IsNullOrWhiteSpace(wcd))
                {
                    conditions.Add("u.Oddeleni LIKE @wcd");
                    parameters.Add("wcd", $"%{wcd}%");
                }

                string whereClause = conditions.Count > 0 ? "WHERE u.rn = 1 AND " + string.Join(" AND ", conditions) : "WHERE u.rn = 1";


                string sql = $@"
                    SELECT
                        u.ID                                       AS Id,
                        ISNULL(u.BIS_Osobni_cislo, '')             AS PersonalNumber,
                        ISNULL(u.BIS_Jmeno, '')                    AS FirstName,
                        ISNULL(u.BIS_Prijmeni, '')                 AS LastName,
                        ISNULL(u.Oddeleni, '')                     AS Department,
                        ISNULL(CAST(u.Stredisko AS VARCHAR), '')   AS Workcenter,
                        ISNULL(CAST(u.Stredisko AS VARCHAR), '')   AS WorkcenterName,
                        ISNULL(e.Category, '')                     AS Category,
                        ISNULL(e.CostNumber, '')                   AS CostNumber,
                        e.HiringDate                               AS HiringDate,
                        CAST(ISNULL(u.BIS_Aktivni, 0) AS BIT)      AS IsActive,
                        ISNULL(e.HasWashingProgram, 0)             AS HasWashingProgram,
                        e.Photo                                    AS Photo,
                        ISNULL(u.User_Name, '')                    AS UserName,
                        ISNULL(u.EMail, '')                        AS Email,
                        ISNULL(u.BIS_Cislo_Karty, '')              AS CardNumber,
                        CAST(ISNULL(u.BIS_Aktivni, 0) AS BIT)      AS BisActive,
                        u.BIS_Osoba_ID                             AS BisOsobaId,
                        e.LeavingDate                              AS LeavingDate
                    FROM (SELECT ID, BIS_Osobni_cislo, BIS_Jmeno, BIS_Prijmeni, Oddeleni, Stredisko, BIS_Aktivni, User_Name, EMail, BIS_Cislo_Karty, BIS_Osoba_ID,
                                 ROW_NUMBER() OVER(PARTITION BY ISNULL(BIS_Osobni_cislo, CAST(ID AS NVARCHAR)) ORDER BY ID DESC) AS rn
                          FROM USER_MANAGEMENT.dbo.USERS) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                    {whereClause} ORDER BY u.BIS_Prijmeni, u.BIS_Jmeno";

                var result = await connection.QueryAsync<EmployeeDto>(sql, parameters);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET] Error loading employees.");
                return StatusCode(500, new { success = false, message = "Chyba při načítání zaměstnanců." });
            }
        }

        [HttpGet("departments")]
        public async Task<IActionResult> GetDepartments()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var sql = "SELECT DISTINCT Oddeleni FROM USER_MANAGEMENT.dbo.USERS WHERE Oddeleni IS NOT NULL AND BIS_Aktivni = 1 AND Oddeleni != '' ORDER BY Oddeleni";
                var depts = await connection.QueryAsync<string>(sql);
                return Ok(new { success = true, data = depts });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET Departments] Error.");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
        [HttpGet("{personalNumber}")]
        public async Task<IActionResult> GetEmployeeDetail(string personalNumber)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureSchemaAsync(connection);
                
                var param = new { pn = Uri.UnescapeDataString(personalNumber) };

                string sql = @"
                    SELECT TOP 1
                        u.BIS_Osobni_cislo                                   AS personalNumber,
                        ISNULL(u.BIS_Jmeno, '')                              AS firstName,
                        ISNULL(u.BIS_Prijmeni, '')                           AS lastName,
                        ISNULL(u.Oddeleni, '')                               AS department,
                        ISNULL(CAST(u.Stredisko AS VARCHAR), '')             AS costCenter,
                        ISNULL(CAST(u.Stredisko AS VARCHAR), '')             AS wcName,
                        ISNULL(CAST(u.Stredisko AS VARCHAR), '')             AS workcenterName,
                        ISNULL(CAST(u.Stredisko AS VARCHAR), '')             AS workcenter,
                        ISNULL(
                            CAST(u.Stredisko AS VARCHAR) +
                            CASE WHEN ISNULL(e.WorkcenterDesc, '') <> ''
                                 THEN ', ' + e.WorkcenterDesc ELSE '' END,
                            ''
                        )                                                    AS workcenterLabel,
                        CAST(ISNULL(u.BIS_Aktivni, 0) AS BIT)                AS isActive,
                        CONVERT(varchar(10), e.HiringDate, 23)               AS hiringDate,
                        ISNULL(e.Phone, '')                                  AS phone,
                        ISNULL(u.EMail, ISNULL(e.Email, ''))                 AS email,
                        ISNULL(e.Position, '')                               AS position,
                        ISNULL(e.Level, '')                                  AS level,
                        ISNULL(u.User_Name, '')                              AS userName,
                        ISNULL(NULLIF(ISNULL(mgr_u.BIS_Jmeno + ' ' + mgr_u.BIS_Prijmeni, ''), ''), ISNULL(e.ManagerName, '—')) AS managerName
                    FROM (SELECT ID, BIS_Osobni_cislo, BIS_Jmeno, BIS_Prijmeni, Oddeleni, Stredisko, BIS_Aktivni, User_Name, EMail, BIS_Osoba_ID,
                                 ROW_NUMBER() OVER(PARTITION BY BIS_Osobni_cislo ORDER BY ID DESC) AS rn
                          FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osobni_cislo IS NOT NULL) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                    LEFT JOIN HR.dbo.EMPLOYEES mgr ON mgr.ID = e.ManagerID
                    LEFT JOIN (SELECT BIS_Osoba_ID, BIS_Jmeno, BIS_Prijmeni, ROW_NUMBER() OVER(PARTITION BY BIS_Osoba_ID ORDER BY ID DESC) AS rn FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osoba_ID IS NOT NULL) mgr_u
                        ON mgr_u.BIS_Osoba_ID = mgr.BIS_Osoba_ID AND mgr_u.rn = 1
                    WHERE u.BIS_Osobni_cislo = @pn AND u.rn = 1";

                var result = await connection.QueryFirstOrDefaultAsync(sql, param);

                if (result == null) return NotFound(new { success = false, message = "Zaměstnanec nenalezen." });

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET Detail] Error.");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromBody] NewEmployeePayload body)
        {
            if (string.IsNullOrWhiteSpace(body.FirstName)) return BadRequest(new { success = false, message = "Jméno je povinné." });
            if (string.IsNullOrWhiteSpace(body.LastName)) return BadRequest(new { success = false, message = "Příjmení je povinné." });
            if (string.IsNullOrWhiteSpace(body.Department)) return BadRequest(new { success = false, message = "Oddělení je povinné." });

            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var uParams = new DynamicParameters();
                uParams.Add("pn", body.PersonalNumber);
                uParams.Add("firstName", body.FirstName);
                uParams.Add("lastName", body.LastName);
                uParams.Add("dept", body.Department);
                uParams.Add("email", body.Email);
                uParams.Add("userName", !string.IsNullOrEmpty(body.UserName) ? body.UserName : (body.PersonalNumber ?? body.FirstName.ToLower()));
                uParams.Add("active", body.IsActive ?? true);
                uParams.Add("facility", "ZF1");
                uParams.Add("language", "CZE");

                string sqlInsertUser = @"
                    INSERT INTO USER_MANAGEMENT.dbo.USERS
                        (BIS_Osobni_cislo, BIS_Jmeno, BIS_Prijmeni, Oddeleni, EMail, User_Name, User_Name_2, Aktivni, BIS_Aktivni, Facility, Language)
                    OUTPUT INSERTED.ID AS id, INSERTED.BIS_Osobni_cislo AS personalNumber, INSERTED.BIS_Jmeno AS firstName, INSERTED.BIS_Prijmeni AS lastName, INSERTED.Oddeleni AS department, INSERTED.Aktivni AS isActive
                    VALUES (@pn, @firstName, @lastName, @dept, @email, @userName, @userName, @active, @active, @facility, @language)";
                
                var newUser = await connection.QuerySingleAsync(sqlInsertUser, uParams);

                if (!string.IsNullOrWhiteSpace(body.PersonalNumber))
                {
                    try
                    {
                        var eParams = new DynamicParameters();
                        eParams.Add("pn", body.PersonalNumber); eParams.Add("firstName", body.FirstName); eParams.Add("lastName", body.LastName);
                        eParams.Add("dept", body.Department); eParams.Add("cc", body.CostCenter); eParams.Add("wc", body.Workcenter);
                        eParams.Add("hiring", body.HiringDate); eParams.Add("active", body.IsActive ?? true); eParams.Add("phone", body.Phone);
                        eParams.Add("email", body.Email); eParams.Add("position", body.Position); eParams.Add("level", body.Level); eParams.Add("managerName", body.ManagerName);

                        string sqlInsertEmployee = @"
                            IF NOT EXISTS (SELECT 1 FROM HR.dbo.EMPLOYEES WHERE PersonalNumber = @pn)
                            INSERT INTO HR.dbo.EMPLOYEES (PersonalNumber, FirstName, LastName, Department, CostCenter, Workcenter, HiringDate, IsActive, CreatedAt, UpdatedAt, Phone, Email, Position, [Level], ManagerName)
                            VALUES (@pn, @firstName, @lastName, @dept, @cc, @wc, @hiring, @active, SYSDATETIME(), SYSDATETIME(), @phone, @email, @position, @level, @managerName)";
                        await connection.ExecuteAsync(sqlInsertEmployee, eParams);
                    }
                    catch (Exception ex) { _logger.LogWarning(ex, "EMPLOYEES helper insert failed."); }
                }

                return Ok(new { success = true, data = newUser });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[POST] Error saving employee.");
                return StatusCode(500, new { success = false, message = "Chyba při ukládání zaměstnance." });
            }
        }
    }

    public class NewEmployeePayload
    {
        public string? PersonalNumber { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Department { get; set; }
        public string? CostCenter { get; set; }
        public string? Workcenter { get; set; }
        public DateTime? HiringDate { get; set; }
        public bool? IsActive { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Position { get; set; }
        public string? Level { get; set; }
        public string? ManagerName { get; set; }
        public string? UserName { get; set; }
    }
}
