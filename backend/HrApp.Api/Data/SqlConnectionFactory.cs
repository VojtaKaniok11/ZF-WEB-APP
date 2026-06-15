using Microsoft.Data.SqlClient;
using System.Data;

namespace HrApp.Api.Data
{
    public interface ISqlConnectionFactory
    {
        IDbConnection CreateHrConnection();
        IDbConnection CreateUserMgmtConnection();
    }

    public class SqlConnectionFactory : ISqlConnectionFactory
    {
        private readonly string? _hrConnectionString;
        private readonly string? _userMgmtConnectionString;

        public SqlConnectionFactory(string? hrConnectionString, string? userMgmtConnectionString)
        {
            _hrConnectionString = AdjustConnectionStringForMachine(hrConnectionString);
            _userMgmtConnectionString = AdjustConnectionStringForMachine(userMgmtConnectionString);
        }

        private static string? AdjustConnectionStringForMachine(string? connectionString)
        {
            if (string.IsNullOrEmpty(connectionString)) return connectionString;
            
            var machineName = Environment.MachineName;
            if (machineName.Equals("VojtaKaniok", StringComparison.OrdinalIgnoreCase))
            {
                return connectionString
                    .Replace("FRYV07778\\SCM_0RMG_BIS", "VojtaKaniok\\SQLTESTOVACI", StringComparison.OrdinalIgnoreCase)
                    .Replace("FRYV07778\\\\SCM_0RMG_BIS", "VojtaKaniok\\\\SQLTESTOVACI", StringComparison.OrdinalIgnoreCase)
                    .Replace("User Id=HR;Password=HR.01;", "Integrated Security=True;", StringComparison.OrdinalIgnoreCase);
            }
            return connectionString;
        }

        public IDbConnection CreateHrConnection()
        {
            if (string.IsNullOrEmpty(_hrConnectionString))
                throw new InvalidOperationException("HR database connection string is not configured.");
            
            return new SqlConnection(_hrConnectionString);
        }

        public IDbConnection CreateUserMgmtConnection()
        {
            if (string.IsNullOrEmpty(_userMgmtConnectionString))
                throw new InvalidOperationException("User Management database connection string is not configured.");
                
            return new SqlConnection(_userMgmtConnectionString);
        }
    }
}
