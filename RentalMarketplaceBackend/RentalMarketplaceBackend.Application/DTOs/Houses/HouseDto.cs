namespace RentalMarketplaceBackend.Application.DTOs.Houses;

public class HouseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public string PropertyType { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? Neighborhood { get; set; }

    public decimal Price { get; set; }
    public string PriceUnit { get; set; } = string.Empty;

    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public double AreaSqM { get; set; }
    public bool IsFurnished { get; set; }

    public int? FloorNumber { get; set; }
    public int? MasterBedrooms { get; set; }
    public int? ApartmentsInBuilding { get; set; }
    public string? BuildingAge { get; set; }

    public int TurnoverDays { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public DateTime CreatedAt { get; set; }

    public string OwnerId { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string? OwnerPhone { get; set; }

    public List<string> ImageUrls { get; set; } = new();
}