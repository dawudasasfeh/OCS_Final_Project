using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RentalMarketplaceBackend.Infrastructure;
using RentalMarketplaceBackend.Application;
using System.Text;
using System.Threading.RateLimiting;
using RentalMarketplaceBackend.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// ── required settings ────────────────────────────────────────────────
// Secrets and machine-specific values are no longer in a tracked file.
// Development gets them from appsettings.Development.json; anywhere else they
// must arrive as environment variables. Checked here, at startup, so a missing
// one fails with a sentence saying which, instead of as a 500 on first request.
var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException(
        "Jwt:Key is not set. Set the Jwt__Key environment variable to a random string of at least 32 characters.");

// HMAC-SHA256 refuses a key under 256 bits, but only when the first token is
// signed. Better to find out now.
if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Jwt:Key must be at least 32 bytes long.");

if (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("DefaultConnection")))
    throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection is not set. Set the ConnectionStrings__DefaultConnection environment variable.");

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

// The frontend is a separate site, so an API with no allowed origins cannot be
// used by it at all — every browser call fails CORS with no server-side trace.
if (allowedOrigins.Length == 0)
    throw new InvalidOperationException(
        "Cors:AllowedOrigins is empty. Set Cors__AllowedOrigins__0 to the frontend's address, e.g. https://beytak.pages.dev");

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddCors(o => o.AddPolicy("react", p => p
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()));

// Sign-in and registration are the only endpoints a stranger can hammer
// without an account. Account lockout (see AddInfrastructure) stops guessing
// one password; this stops sweeping many accounts from one address. The limit
// is generous because behind a proxy several real users can share an address.
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("auth", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 20,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        }));
});

builder.Services.AddAuthorization();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    // Brings a fresh or older database up to the current schema on every
    // start, so deploying never needs a separate `dotnet ef` step. A no-op
    // when nothing is pending.
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    await DbSeeder.SeedAsync(scope.ServiceProvider);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    // An unhandled exception becomes a ProblemDetails 500 without a stack trace.
    app.UseExceptionHandler();
    app.UseHsts();
}

app.UseHttpsRedirection();

// Serves wwwroot, which is where uploaded listing images land. It sits before
// authentication because a listing photo is public once the listing is approved.
app.UseStaticFiles();

app.UseCors("react");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Liveness only, deliberately not a database check: a host pinging this every
// minute would otherwise keep a serverless database from ever pausing.
app.MapHealthChecks("/health");

app.MapControllers();

app.Run();
