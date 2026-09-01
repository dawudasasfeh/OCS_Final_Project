using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Domain.Entities;

public class Booking
{
    public int Id { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public DurationType DurationType { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int HouseId { get; set; }
    public House? House { get; set; }
    [Required]
    public string RenterId { get; set; } = string.Empty;
    public ApplicationUser? Renter { get; set; }
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
