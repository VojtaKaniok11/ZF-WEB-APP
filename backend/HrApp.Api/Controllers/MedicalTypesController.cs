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

        public MedicalTypesController(ISqlConnectionFactory connectionFactory, ILogger<MedicalTypesController> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetMedicalExamTypes()
        {
            try
            {
                using var connection = _connectionFactory.CreateHrConnection();
                string sql = "SELECT ID AS id, Name AS name, ValidityMonths AS validityMonths, Category AS category, Description AS description FROM dbo.MEDICAL_EXAM_TYPES";
                var result = await connection.QueryAsync(sql);
                
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET /api/medical-types] Error");
                return StatusCode(500, new { success = false, message = "Chyba DB." });
            }
        }
    }
}
