using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Domain.Entities;

public class Payment
{
    public int Id { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    [Range(0.01, 9999999)]
    public decimal Amount { get; set; }
    public PaymentPurpose Purpose { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    [MaxLength(250)]
    public string? ReferenceNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    [Required]
    public string PayerId { get; set; } = string.Empty;
    public ApplicationUser? Payer { get; set; }
    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }
}
