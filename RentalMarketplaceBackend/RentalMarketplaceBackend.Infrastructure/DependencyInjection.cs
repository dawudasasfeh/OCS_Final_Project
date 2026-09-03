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
            services.AddDbContext<AppDbContext>(o =>
                o.UseSqlServer(config.GetConnectionString("DefaultConnection")));

            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddIdentityCore<ApplicationUser>()
                .AddRoles<IdentityRole>()
                .AddEntityFrameworkStores<AppDbContext>();

            services.AddScoped<ITokenService, TokenService>();
            return services;

        }

    }
}
