using RentalMarketplaceBackend.Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentalMarketplaceBackend.Domain.Entities;

public class House
{
    public int Id { get; set; }
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;
    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;
    [Required]
    [MaxLength(250)]
    public PropertyType PropertyType { get; set; }
    public string Address { get; set; } = string.Empty;
    [Required]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;
    [Column(TypeName = "decimal(18,2)")]
    [Range(0.01, 9999999)]
    public decimal Price { get; set; }
    public DurationType PriceUnit { get; set; }
    [Range(0, 50)]
    public int Bedrooms { get; set; }
    [Range(0, 50)]
    public int Bathrooms { get; set; }

    [Range(1, 100000)]
    public double AreaSqM { get; set; }

    public bool IsAvailable { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public  required string OwnerId { get; set; }
    public ApplicationUser? Owner { get; set; }
    public ICollection<HouseImage> Images { get; set; } = new List<HouseImage>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
