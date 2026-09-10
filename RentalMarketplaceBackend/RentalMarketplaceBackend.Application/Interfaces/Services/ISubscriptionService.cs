using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Subscriptions;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

public interface ISubscriptionService
{
    Task<Result<SubscriptionDto>> GetForUserAsync(string userId);

    /// <summary>
    /// FR-9.1.1 — every registered account with its subscription state, for the
    /// administrator. Ordered so the accounts an admin is looking for come
    /// first: active subscriptions, then lapsed, then everyone else.
    /// </summary>
    Task<IReadOnlyList<AdminUserDto>> GetAllForAdminAsync();
    Task<Result<SubscriptionDto>> GrantAsync(string userId);
    Task<Result<SubscriptionDto>> RevokeAsync(string userId);
    Task<bool> IsActiveAsync(string userId);
}