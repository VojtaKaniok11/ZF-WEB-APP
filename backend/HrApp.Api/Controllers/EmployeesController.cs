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

        public EmployeesController(ISqlConnectionFactory connectionFactory, ILogger<EmployeesController> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetEmployees([FromQuery] string? search, [FromQuery] string? dept, [FromQuery] string? wp, [FromQuery] string? wc)
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                var conditions = new List<string>();
                var parameters = new DynamicParameters();

                // Always only active people
                conditions.Add("u.Aktivni = 1");

                if (!string.IsNullOrWhiteSpace(search))
                {
                    conditions.Add("(u.BIS_Jmeno LIKE @search OR u.BIS_Prijmeni LIKE @search OR u.BIS_Osobni_cislo LIKE @search OR u.User_Name LIKE @search)");
                    parameters.Add("search", $"%{search}%");
                }
                if (!string.IsNullOrWhiteSpace(dept))
                {
                    conditions.Add("u.Oddeleni = @dept");
                    parameters.Add("dept", dept);
                }

                if (wp == "yes") conditions.Add("ISNULL(e.HasWashingProgram, 0) = 1");
                else if (wp == "no") conditions.Add("ISNULL(e.HasWashingProgram, 0) = 0");

                if (!string.IsNullOrWhiteSpace(wc))
                {
                    conditions.Add("(e.Workcenter LIKE @wc OR w.WC_DESC LIKE @wc)");
                    parameters.Add("wc", $"%{wc}%");
                }

                string whereClause = conditions.Count > 0 ? "WHERE u.rn = 1 AND u.Aktivni = 1 AND " + string.Join(" AND ", conditions) : "WHERE u.rn = 1 AND u.Aktivni = 1";

                string sql = $@"
                    SELECT
                        u.ID                                       AS Id,
                        ISNULL(u.BIS_Osobni_cislo, '')             AS PersonalNumber,
                        ISNULL(u.BIS_Jmeno, '')                    AS FirstName,
                        ISNULL(u.BIS_Prijmeni, '')                 AS LastName,
                        ISNULL(u.Oddeleni, '')                     AS Department,
                        ISNULL(e.Workcenter, '')                   AS Workcenter,
                        ISNULL('(FRY) ' + w.WC_DESC, '')           AS WorkcenterName,
                        e.HiringDate                               AS HiringDate,
                        CAST(ISNULL(u.Aktivni, 0) AS BIT)          AS IsActive,
                        ISNULL(e.HasWashingProgram, 0)             AS HasWashingProgram,
                        e.Photo                                    AS Photo,
                        ISNULL(u.User_Name, '')                    AS UserName,
                        ISNULL(u.EMail, '')                        AS Email,
                        ISNULL(u.BIS_Cislo_Karty, '')              AS CardNumber,
                        CAST(ISNULL(u.BIS_Aktivni, 0) AS BIT)      AS BisActive,
                        u.BIS_Osoba_ID                             AS BisOsobaId
                    FROM (SELECT *, ROW_NUMBER() OVER(PARTITION BY ISNULL(BIS_Osobni_cislo, CAST(ID AS NVARCHAR)) ORDER BY ID DESC) AS rn FROM USER_MANAGEMENT.dbo.USERS) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                    LEFT JOIN FRYaddpm.dbo.WORKCENTERS w ON w.WORKCENTER = e.Workcenter
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
                var sql = "SELECT DISTINCT Oddeleni FROM USER_MANAGEMENT.dbo.USERS WHERE Oddeleni IS NOT NULL AND Aktivni = 1 AND Oddeleni != '' ORDER BY Oddeleni";
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
                var param = new { pn = Uri.UnescapeDataString(personalNumber) };

                string sql = @"
                    SELECT TOP 1
                        u.BIS_Osobni_cislo                                   AS personalNumber,
                        ISNULL(u.BIS_Jmeno, '')                              AS firstName,
                        ISNULL(u.BIS_Prijmeni, '')                           AS lastName,
                        ISNULL(u.Oddeleni, '')                               AS department,
                        ISNULL(CAST(u.Stredisko AS VARCHAR), '')             AS costCenter,
                        ISNULL('(FRY) ' + w.WC_DESC, '')           AS wcName,
                        ISNULL('(FRY) ' + w.WC_DESC, '')           AS workcenterName,
                        ISNULL(e.Workcenter, '')                             AS workcenter,
                        CAST(ISNULL(u.Aktivni, 0) AS BIT)                    AS isActive,
                        CONVERT(varchar(10), e.HiringDate, 23)               AS hiringDate,
                        ISNULL(e.Phone, '')                                  AS phone,
                        ISNULL(u.EMail, ISNULL(e.Email, ''))                 AS email,
                        ISNULL(e.Position, '')                               AS position,
                        ISNULL(e.Level, '')                                  AS level,
                        ISNULL(u.User_Name, '')                              AS userName,
                        ISNULL(NULLIF(ISNULL(mgr_u.BIS_Jmeno + ' ' + mgr_u.BIS_Prijmeni, ''), ''), ISNULL(e.ManagerName, '—')) AS managerName
                    FROM (SELECT *, ROW_NUMBER() OVER(PARTITION BY BIS_Osobni_cislo ORDER BY ID DESC) AS rn FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osobni_cislo IS NOT NULL) u
                    LEFT JOIN HR.dbo.EMPLOYEES e ON e.PersonalNumber = u.BIS_Osobni_cislo
                    LEFT JOIN FRYaddpm.dbo.WORKCENTERS w ON w.WORKCENTER = e.Workcenter
                    LEFT JOIN HR.dbo.EMPLOYEES mgr ON mgr.ID = e.ManagerID
                    LEFT JOIN (SELECT BIS_Osoba_ID, BIS_Jmeno, BIS_Prijmeni, ROW_NUMBER() OVER(PARTITION BY BIS_Osoba_ID ORDER BY ID DESC) AS rn FROM USER_MANAGEMENT.dbo.USERS WHERE BIS_Osoba_ID IS NOT NULL) mgr_u 
                        ON mgr_u.BIS_Osoba_ID = mgr.BIS_Osoba_ID AND mgr_u.rn = 1
                    WHERE u.BIS_Osobni_cislo = @pn AND u.rn = 1 AND u.Aktivni = 1";

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
