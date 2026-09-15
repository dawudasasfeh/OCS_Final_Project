using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Infrastructure.Persistence;
using RentalMarketplaceBackend.Infrastructure.Services;
using RentalMarketplaceBackend.Application.Interfaces.Repositories; 
using RentalMarketplaceBackend.Infrastructure.Repositories;

namespace RentalMarketplaceBackend.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(
    this IServiceCollection services, IConfiguration config)
        {
            // Retries cover the transient failures a cloud database produces
            // routinely: a serverless Azure SQL database waking from pause, a
            // failover, a deadlock victim. Locally they never fire.
            services.AddDbContext<AppDbContext>(o =>
                o.UseSqlServer(
                    config.GetConnectionString("DefaultConnection"),
                    sql => sql.EnableRetryOnFailure()));

            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Five wrong passwords lock the account for fifteen minutes.
            // AuthService drives this by hand, because CheckPasswordAsync on its
            // own never counts a failure.
            services.AddIdentityCore<ApplicationUser>(o =>
                {
                    o.Lockout.AllowedForNewUsers = true;
                    o.Lockout.MaxFailedAccessAttempts = 5;
                    o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                })
                .AddRoles<IdentityRole>()
                .AddEntityFrameworkStores<AppDbContext>();

            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IFileStorageService, FileStorageService>();
            return services;

        }

    }
}
