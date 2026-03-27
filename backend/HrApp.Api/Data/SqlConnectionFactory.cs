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
            _hrConnectionString = hrConnectionString;
            _userMgmtConnectionString = userMgmtConnectionString;
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
