namespace RentalMarketplaceBackend.Application.DTOs.Payments;

public class PaymentDto
{
    public int Id { get; set; }

    public decimal Amount { get; set; }
    public string Purpose { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ReferenceNote { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }

    public string PayerId { get; set; } = string.Empty;
    public string PayerName { get; set; } = string.Empty;

    // Null on a subscription payment, which belongs to no booking.
    public int? BookingId { get; set; }
    public string? HouseTitle { get; set; }
}