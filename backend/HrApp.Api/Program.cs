using HrApp.Api.Data;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
       .AddJsonOptions(options =>
       {
           // Next.js (React) expects camelCase keys by default (e.g. personalNumber, not PersonalNumber)
           options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
           options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
       });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS - only needed for local development (frontend on 3000, backend on 5062)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // Next.js dev port
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure Custom SQL Connection Factory
builder.Services.AddSingleton<ISqlConnectionFactory>(provider =>
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    var hrDb = configuration.GetConnectionString("HrDatabase");
    var userMgmtDb = configuration.GetConnectionString("UserMgmtDatabase");
    return new SqlConnectionFactory(hrDb, userMgmtDb);
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    // CORS only needed in development (separate ports)
    app.UseCors("AllowNextJs");
}

// Serve Next.js static export from wwwroot/
// After build, copy contents of Next.js 'out/' folder into this app's 'wwwroot/' folder
app.UseDefaultFiles();   // serves index.html for /
app.UseStaticFiles();    // serves all static assets (_next/, images, etc.)

app.UseAuthorization();
app.MapControllers();

// SPA fallback - all unmatched routes serve index.html (handles React client-side routing)
app.MapFallbackToFile("index.html");

app.Run();
