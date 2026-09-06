using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentalMarketplaceBackend.Domain.Entities;

public class Testimonial
{
    public int Id { get; set; }
    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;
    public TestimonialStatus Status { get; set; } = TestimonialStatus.Pending;
    public DateTime? ApprovedAt { get; set; } = null;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }
}
