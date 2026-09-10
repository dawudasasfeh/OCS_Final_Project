using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Subscriptions;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Domain.Entities;

namespace RentalMarketplaceBackend.Application.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;
    private readonly IUnitOfWork _uow;

    public SubscriptionService(
        UserManager<ApplicationUser> userManager,
        IConfiguration config,
        IUnitOfWork uow)
    {
        _userManager = userManager;
        _config = config;
        _uow = uow;
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

    public async Task<IReadOnlyList<AdminUserDto>> GetAllForAdminAsync()
    {
        // Listing counts come from one grouped query rather than a count per
        // user — thirteen accounts today, but a per-row query is the kind of
        // thing that is fine until it is not.
        var listingCounts = await _uow.Houses.CountByOwnerAsync();

        // ToList, not ToListAsync: this layer deliberately does not reference
        // EF Core, so the async LINQ extensions are not available here — the
        // persistence detail stays behind the repository boundary.
        var users = _userManager.Users.ToList();
        var rows = new List<AdminUserDto>(users.Count);

        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);

            rows.Add(new AdminUserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email ?? string.Empty,
                PhoneNumber = u.PhoneNumber,
                Role = roles.FirstOrDefault() ?? "User",
                IsSubscribed = u.IsSubscribed,
                ExpiresAt = u.SubscriptionExpiresAt,
                IsActive = IsActive(u),
                ListingCount = listingCounts.TryGetValue(u.Id, out var c) ? c : 0
            });
        }

        // Active first, then lapsed — someone whose subscription ran out is the
        // row an admin is most likely looking for after the active ones — then
        // everyone else, alphabetically inside each group.
        return rows
            .OrderByDescending(r => r.IsActive)
            .ThenByDescending(r => r.ExpiresAt.HasValue)
            .ThenBy(r => r.FullName)
            .ToList();
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