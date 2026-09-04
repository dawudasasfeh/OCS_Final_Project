using System.ComponentModel.DataAnnotations;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.DTOs.Houses;

public class HouseSearchDto
{
    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? Neighborhood { get; set; }

    [EnumDataType(typeof(PropertyType))]
    public PropertyType? PropertyType { get; set; }

    [EnumDataType(typeof(DurationType))]
    public DurationType? PriceUnit { get; set; }

    [Range(0, 9999999)]
    public decimal? MinPrice { get; set; }

    [Range(0, 9999999)]
    public decimal? MaxPrice { get; set; }

    [Range(0, 50)]
    public int? Bedrooms { get; set; }

    [Range(0, 50)]
    public int? Bathrooms { get; set; }

    public bool? IsFurnished { get; set; }

    public ListingStatus? Status { get; set; }
}
