using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Subscriptions;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Domain.Entities;

namespace RentalMarketplaceBackend.Application.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;

    public SubscriptionService(
        UserManager<ApplicationUser> userManager,
        IConfiguration config)
    {
        _userManager = userManager;
        _config = config;
    }

    private decimal Price =>
        decimal.TryParse(_config["Subscription:PricePerMonth"], out var p) ? p : 20m;

    private int Months =>
        int.TryParse(_config["Subscription:Months"], out var m) ? m : 1;

    private static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);

    public async Task<Result<SubscriptionDto>> GetForUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
            return Result<SubscriptionDto>.Fail("Account not found.");

        return Result<SubscriptionDto>.Ok(Map(user));
    }

    public async Task<Result<SubscriptionDto>> GrantAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
            return Result<SubscriptionDto>.Fail("Account not found.");

        // Extend from whichever is later, so renewing early is not a penalty.
        var from = user.SubscriptionExpiresAt is { } expiry && expiry > Today
            ? expiry
            : Today;

        user.SubscriptionExpiresAt = from.AddMonths(Months);
        user.IsSubscribed = true;

        await _userManager.UpdateAsync(user);

        return Result<SubscriptionDto>.Ok(Map(user));
    }

    public async Task<Result<SubscriptionDto>> RevokeAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
            return Result<SubscriptionDto>.Fail("Account not found.");

        user.SubscriptionExpiresAt = null;
        user.IsSubscribed = false;

        await _userManager.UpdateAsync(user);

        return Result<SubscriptionDto>.Ok(Map(user));
    }

    public async Task<bool> IsActiveAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        return user is not null && IsActive(user);
    }

    private static bool IsActive(ApplicationUser u) =>
        u.SubscriptionExpiresAt is { } expiry && expiry >= Today;

    private SubscriptionDto Map(ApplicationUser u) => new()
    {
        IsActive = IsActive(u),
        ExpiresAt = u.SubscriptionExpiresAt,
        DaysRemaining = u.SubscriptionExpiresAt is { } e && e >= Today
            ? e.DayNumber - Today.DayNumber
            : 0,
        PricePerMonth = Price,
        Months = Months
    };
}