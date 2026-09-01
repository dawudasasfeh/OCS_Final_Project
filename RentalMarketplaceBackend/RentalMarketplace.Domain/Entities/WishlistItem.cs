using System.ComponentModel.DataAnnotations;
namespace RentalMarketplaceBackend.Domain.Entities;

public class WishlistItem
{
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser? User { get; set; }

    public int HouseId { get; set; }

    public House? House { get; set; }
}
