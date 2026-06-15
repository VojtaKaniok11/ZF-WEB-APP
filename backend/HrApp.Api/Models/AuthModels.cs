namespace HrApp.Api.Models
{
    public class UserDto
    {
        public int Id { get; set; }
        public string? PersonalNumber { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Department { get; set; }
        public string? UserName { get; set; }
        public string? DisplayName { get; set; }
        public List<string> Roles { get; set; } = new();
    }

    public class LoginPayload
    {
        public string? PersonalNumber { get; set; }
        public string? Password { get; set; }
    }

    public class ChangePasswordPayload
    {
        public int UserId { get; set; }
        public string? NewPassword { get; set; }
    }
}
