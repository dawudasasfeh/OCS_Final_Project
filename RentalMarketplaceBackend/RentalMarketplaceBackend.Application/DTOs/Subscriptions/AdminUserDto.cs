namespace RentalMarketplaceBackend.Application.DTOs.Subscriptions;

/// <summary>
/// One row of the administrator's user list — FR-9.1.1.
///
/// Carries no password hash, no security stamp and no token: an administrator
/// needs to see who someone is and what their subscription is doing, not to
/// impersonate them. ListingCount is here because it is the question an admin
/// actually asks before revoking a subscription — whether anything is published
/// that would stop being publishable.
/// </summary>
public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "User";

    public bool IsSubscribed { get; set; }
    public DateOnly? ExpiresAt { get; set; }

    /// <summary>
    /// True only when the flag is set AND the date has not passed. The flag
    /// alone is not the answer: a lapsed owner still has IsSubscribed true.
    /// </summary>
    public bool IsActive { get; set; }

    public int ListingCount { get; set; }
}
