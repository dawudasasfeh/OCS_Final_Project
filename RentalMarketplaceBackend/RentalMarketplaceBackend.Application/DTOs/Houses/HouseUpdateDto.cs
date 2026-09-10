using System.ComponentModel.DataAnnotations;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.DTOs.Houses;

/// <summary>
/// What an owner may change about a listing after it exists.
///
/// Deliberately not HouseCreateDto reused: that one carries ImageUrls, and
/// images are added through their own endpoint rather than by resubmitting the
/// whole listing. Sharing the type would also mean every future change to
/// creation silently became a change to editing.
///
/// Note what is absent — OwnerId and Status. Neither is the owner's to set:
/// ownership comes from the token, and status is the moderator's decision. A
/// DTO that cannot express a field cannot be used to smuggle it, which is a
/// stronger guarantee than remembering to validate it away.
/// </summary>
public class HouseUpdateDto
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
}
