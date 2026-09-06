using RentalMarketplaceBackend.Domain.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace RentalMarketplaceBackend.Application.DTOs.Testimonials;

public class TestimonialDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string UserName { get; set; } = string.Empty;
}
