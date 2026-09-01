using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentalMarketplaceBackend.Domain.Entities;

public class HouseImage
{
    public int Id { get; set; }
    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public int HouseId { get; set; }
}
