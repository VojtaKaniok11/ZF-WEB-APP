using HrApp.Api.Data;
using System.Text.Json.Serialization;

var options = new WebApplicationOptions
{
    Args = args,
    WebRootPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot")
};
var builder = WebApplication.CreateBuilder(options);
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

// Define MIME types for Next.js assets
var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
provider.Mappings[".js"] = "text/javascript";
provider.Mappings[".css"] = "text/css";
provider.Mappings[".woff2"] = "font/woff2";
provider.Mappings[".woff"] = "font/woff";
provider.Mappings[".ttf"] = "font/ttf";
provider.Mappings[".json"] = "application/json";
provider.Mappings[".txt"] = "text/plain"; // Next.js App Router payloads

// Serve Next.js static export from wwwroot/
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider,
    ServeUnknownFileTypes = true,
    DefaultContentType = "application/octet-stream"
});

app.UseAuthorization();
app.MapControllers();

// SPA fallback - all unmatched routes serve index.html (handles React client-side routing)
app.MapFallbackToFile("index.html");

app.Run();
