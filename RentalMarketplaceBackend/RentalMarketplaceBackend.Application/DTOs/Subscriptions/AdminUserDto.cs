namespace RentalMarketplaceBackend.Application.DTOs.Subscriptions;

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "User";

    public bool IsSubscribed { get; set; }
    public DateOnly? ExpiresAt { get; set; }

    public bool IsActive { get; set; }

    public int ListingCount { get; set; }
}
