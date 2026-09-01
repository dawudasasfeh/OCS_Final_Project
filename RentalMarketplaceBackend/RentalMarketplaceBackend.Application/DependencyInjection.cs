using Microsoft.Extensions.DependencyInjection;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Application.Services;

namespace RentalMarketplaceBackend.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}