using System.ComponentModel.DataAnnotations;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.DTOs.Houses;

public class HouseCreateDto
{
    [Required, MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [EnumDataType(typeof(PropertyType))]
    public PropertyType PropertyType { get; set; }

    [Required, MaxLength(250)]
    public string Address { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Neighborhood { get; set; }

    [Range(0.01, 9999999)]
    public decimal Price { get; set; }

    [EnumDataType(typeof(DurationType))]
    public DurationType PriceUnit { get; set; }

    [Range(0, 50)] public int Bedrooms { get; set; }
    [Range(0, 50)] public int Bathrooms { get; set; }
    [Range(1, 100000)] public double AreaSqM { get; set; }

    public bool IsFurnished { get; set; }

    [Range(0, 50)] public int? FloorNumber { get; set; }
    [Range(0, 20)] public int? MasterBedrooms { get; set; }
    [Range(1, 500)] public int? ApartmentsInBuilding { get; set; }

    [EnumDataType(typeof(BuildingAge))]
    public BuildingAge? BuildingAge { get; set; }

    [Range(0, 30)]
    public int TurnoverDays { get; set; } = 2;

    public List<string> ImageUrls { get; set; } = new();
}