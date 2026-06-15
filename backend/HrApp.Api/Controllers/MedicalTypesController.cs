using Dapper;
using HrApp.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace HrApp.Api.Controllers
{
    [ApiController]
    [Route("api/medical-types")]
    public class MedicalTypesController : ControllerBase
    {
        private readonly ISqlConnectionFactory _connectionFactory;
        private readonly ILogger<MedicalTypesController> _logger;
        private static bool _schemaChecked = false;

        public MedicalTypesController(ISqlConnectionFactory connectionFactory, ILogger<MedicalTypesController> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        private async Task EnsureSchemaAsync(System.Data.IDbConnection connection)
        {
            if (_schemaChecked) return;
            try
            {
                await connection.ExecuteAsync(@"
                    IF COL_LENGTH('dbo.MEDICAL_EXAM_TYPES', 'Description') IS NULL
                        ALTER TABLE dbo.MEDICAL_EXAM_TYPES ADD Description NVARCHAR(500) NULL;
                    IF COL_LENGTH('dbo.MEDICAL_EXAM_TYPES', 'MedicalFacility') IS NULL
                        ALTER TABLE dbo.MEDICAL_EXAM_TYPES ADD MedicalFacility NVARCHAR(255) NULL;
                ");
                _schemaChecked = true;
            }
            catch { /* sloupec možná již existuje nebo jiná DB */ }
        }

        [HttpGet]
        public async Task<IActionResult> GetMedicalExamTypes()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureSchemaAsync(connection);
                string sql = "SELECT ID AS id, Name AS name, ISNULL(Description, '') AS description, ValidityMonths AS validityMonths, Category AS category, ISNULL(MedicalFacility, '') AS medicalFacility FROM dbo.MEDICAL_EXAM_TYPES ORDER BY Category, Name";
                var result = await connection.QueryAsync(sql);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/medical-types] Error");
                return StatusCode(500, new { success = false, message = "Chyba DB." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateMedicalType([FromBody] NewMedicalTypePayload body)
        {
            if (string.IsNullOrWhiteSpace(body.Name) || string.IsNullOrWhiteSpace(body.Category)) return BadRequest(new { success = false, message = "Neplatné údaje." });
            if (string.IsNullOrWhiteSpace(body.MedicalFacility)) return BadRequest(new { success = false, message = "Chybí lékařské zařízení." });
            if (string.IsNullOrWhiteSpace(body.Description)) return BadRequest(new { success = false, message = "Chybí poznámka." });
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                await EnsureSchemaAsync(connection);
                string newId = $"MT-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}";
                string sql = "INSERT INTO dbo.MEDICAL_EXAM_TYPES (ID, Name, ValidityMonths, Category, Description, MedicalFacility) VALUES (@id, @name, @val, @cat, @desc, @fac)";
                await connection.ExecuteAsync(sql, new { id = newId, name = body.Name.Trim(), val = body.ValidityMonths, cat = body.Category.Trim(), desc = body.Description?.Trim(), fac = body.MedicalFacility?.Trim() });
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[POST /api/medical-types] Error");
                return StatusCode(500, new { success = false, message = $"Chyba při ukládání: {ex.Message}" });
            }
        }
    }

    public class NewMedicalTypePayload
    {
        public string Name { get; set; } = string.Empty;
        public int ValidityMonths { get; set; }
        public string Category { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? MedicalFacility { get; set; }
    }
}
