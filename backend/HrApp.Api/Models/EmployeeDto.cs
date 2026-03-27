namespace HrApp.Api.Models
{
    public class EmployeeDto
    {
        public int Id { get; set; }
        public string PersonalNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Workcenter { get; set; } = string.Empty;
        public string WorkcenterName { get; set; } = string.Empty;
        public DateTime? HiringDate { get; set; }
        public bool IsActive { get; set; }
        public bool HasWashingProgram { get; set; }
        public byte[]? Photo { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string CardNumber { get; set; } = string.Empty;
        public bool BisActive { get; set; }
        public int? BisOsobaId { get; set; }
    }
}
