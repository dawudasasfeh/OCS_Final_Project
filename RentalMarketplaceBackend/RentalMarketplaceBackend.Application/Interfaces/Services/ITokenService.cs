using RentalMarketplaceBackend.Domain.Entities;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

    public interface ITokenService
    {
    (string Token, DateTime ExpiresAt) CreateToken(ApplicationUser user, string role);
    }
