using Dapper;
using HrApp.Api.Data;
using HrApp.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace HrApp.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly ISqlConnectionFactory _connectionFactory;
        private readonly ILogger<AuthController> _logger;

        public AuthController(ISqlConnectionFactory connectionFactory, ILogger<AuthController> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginPayload body)
        {
            if (string.IsNullOrWhiteSpace(body.PersonalNumber) || string.IsNullOrWhiteSpace(body.Password))
                return BadRequest(new { success = false, message = "Zadejte osobní číslo a heslo." });

            try
            {
                using var connection = _connectionFactory.CreateUserMgmtConnection();

                var sql = @"
                    SELECT TOP 1
                        u.ID               AS Id,
                        u.BIS_Osobni_cislo AS PersonalNumber,
                        u.BIS_Jmeno        AS FirstName,
                        u.BIS_Prijmeni     AS LastName,
                        u.Oddeleni         AS Department,
                        u.User_Name        AS UserName
                    FROM USERS u
                    WHERE
                        u.BIS_Osobni_cislo = @pn
                        AND u.BIS_Aktivni = 1
                        AND u.PasswordH512 = HASHBYTES('SHA2_512', CONVERT(NVARCHAR(32), @Password))";

                var user = await connection.QueryFirstOrDefaultAsync<UserDto>(sql, new
                {
                    pn = body.PersonalNumber.Trim(),
                    Password = body.Password
                });

                if (user == null)
                    return Unauthorized(new { success = false, message = "Nesprávné osobní číslo nebo heslo." });

                // Fetch roles from PERMISSIONS table
                var roles = (await connection.QueryAsync<string>(
                    @"SELECT Prava FROM dbo.PERMISSIONS WHERE USER_ID = @UserId",
                    new { UserId = user.Id }
                )).ToList();

                var validRoles = roles.Where(r => r == "admin" || r == "HR" || r == "mistr").ToList();

                if (!validRoles.Any())
                {
                    _logger.LogWarning("[Auth] Login denied for ID {ID}. Missing valid role. Found roles: {Roles}", user.Id, string.Join(", ", roles));
                    return Unauthorized(new { success = false, message = "Nemáte oprávnění k přístupu do aplikace (vyžadována role admin, HR nebo mistr)." });
                }

                user.Roles = validRoles;
                user.DisplayName = $"{user.FirstName} {user.LastName}";

                return Ok(new
                {
                    success = true,
                    data = user
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[POST /api/auth/login] Error");
                return StatusCode(500, new { success = false, message = "Chyba serveru při přihlášení." });
            }
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordPayload body)
        {
            if (body.UserId <= 0 || string.IsNullOrWhiteSpace(body.NewPassword))
            {
                _logger.LogWarning("[Auth] ChangePassword: Invalid input. UserId: {UserId}", body.UserId);
                return BadRequest(new { success = false, message = "Chybí ID uživatele nebo nové heslo." });
            }

            try
            {
                using var connection = _connectionFactory.CreateUserMgmtConnection();

                // Explicit schema and matched parameter name @ID
                var sql = @"
                    UPDATE dbo.USERS 
                    SET PasswordH512 = HASHBYTES('SHA2_512', CONVERT(NVARCHAR(32), @Password))
                    WHERE ID = @ID";

                var affected = await connection.ExecuteAsync(sql, new
                {
                    ID = body.UserId,
                    Password = body.NewPassword
                });

                if (affected == 0)
                {
                    _logger.LogWarning("[Auth] ChangePassword: User with ID {ID} not found.", body.UserId);
                    return NotFound(new { success = false, message = "Uživatel nenalezen." });
                }

                _logger.LogInformation("[Auth] Password changed for user ID: {ID}", body.UserId);
                return Ok(new { success = true, message = "Heslo bylo úspěšně změněno." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[POST /api/auth/change-password] Error changing password for user {ID}", body.UserId);
                return StatusCode(500, new { success = false, message = $"Chyba serveru při změně hesla: {ex.Message}" });
            }
        }
    }
}

