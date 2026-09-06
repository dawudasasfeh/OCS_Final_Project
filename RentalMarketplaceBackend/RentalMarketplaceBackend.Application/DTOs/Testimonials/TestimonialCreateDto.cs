using System.ComponentModel.DataAnnotations;

namespace RentalMarketplaceBackend.Application.DTOs.Testimonials;

public class TestimonialCreateDto
{
    [Required, MaxLength(1000)]
    public string Content { get; set; } = string.Empty;
}
