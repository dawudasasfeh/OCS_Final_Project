using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace RentalMarketplaceBackend.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    [MaxLength(100)]
    public required string FullName { get; set; }
    public bool IsSubscribed { get; set; }
    public DateOnly? SubscriptionExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<House> Houses { get; set; } = new List<House>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();


}
