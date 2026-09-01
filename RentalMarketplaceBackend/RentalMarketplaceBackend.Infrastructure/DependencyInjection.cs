using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RentalMarketplaceBackend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace RentalMarketplaceBackend.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(
    this IServiceCollection services, IConfiguration config)
        {
            services.AddDbContext<AppDbContext>(o =>
                o.UseSqlServer(config.GetConnectionString("DefaultConnection")));
            //services.AddScoped<IUnitOfWork, UnitOfWork>();
            return services;

        }

    }
}
