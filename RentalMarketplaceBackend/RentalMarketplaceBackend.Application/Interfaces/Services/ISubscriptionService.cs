using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Subscriptions;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

public interface ISubscriptionService
{
    Task<Result<SubscriptionDto>> GetForUserAsync(string userId);
    Task<Result<SubscriptionDto>> GrantAsync(string userId);
    Task<Result<SubscriptionDto>> RevokeAsync(string userId);
    Task<bool> IsActiveAsync(string userId);
}