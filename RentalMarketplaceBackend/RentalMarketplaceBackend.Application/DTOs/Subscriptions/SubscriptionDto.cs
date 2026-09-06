namespace RentalMarketplaceBackend.Application.DTOs.Subscriptions;

public class SubscriptionDto
{
    public bool IsActive { get; set; }

    public DateOnly? ExpiresAt { get; set; }
    public int DaysRemaining { get; set; }

    public decimal PricePerMonth { get; set; }
    public int Months { get; set; }
}
