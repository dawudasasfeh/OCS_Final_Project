using RentalMarketplaceBackend.Application.DTOs.Houses;
using RentalMarketplaceBackend.Domain.Entities;

namespace RentalMarketplaceBackend.Application.Mapping;

/// <summary>
/// House to HouseDto, shared by every service that returns listings.
/// It lived inside HouseService until the wishlist needed the same mapping;
/// a second copy is a second thing to keep in step with the DTO.
/// </summary>
public static class HouseMapper
{
    /// <param name="includeContent">
    /// True gives the owner's real phone number, false gives it masked.
    /// Anonymous callers get the mask; signed-in callers get the number.
    /// </param>
    public static HouseDto Map(House h, bool includeContent = false) => new()
    {
        Id = h.Id,
        Title = h.Title,
        Description = h.Description,
        PropertyType = h.PropertyType.ToString(),
        Address = h.Address,
        City = h.City,
        Neighborhood = h.Neighborhood,
        Price = h.Price,
        PriceUnit = h.PriceUnit.ToString(),
        Bedrooms = h.Bedrooms,
        Bathrooms = h.Bathrooms,
        AreaSqM = h.AreaSqM,
        IsFurnished = h.IsFurnished,
        FloorNumber = h.FloorNumber,
        MasterBedrooms = h.MasterBedrooms,
        ApartmentsInBuilding = h.ApartmentsInBuilding,
        BuildingAge = h.BuildingAge?.ToString(),
        TurnoverDays = h.TurnoverDays,
        Status = h.Status.ToString(),
        IsAvailable = h.IsAvailable,
        CreatedAt = h.CreatedAt,
        OwnerId = h.OwnerId,
        OwnerName = h.Owner?.FullName ?? string.Empty,
        OwnerPhone = includeContent ? h.Owner?.PhoneNumber : MaskPhone(h.Owner?.PhoneNumber),
        ImageUrls = h.Images.Select(i => i.ImageUrl).ToList()
    };

    private static string? MaskPhone(string? phone) =>
        string.IsNullOrEmpty(phone) ? null
        : phone.Length <= 4 ? new string('X', phone.Length)
        : phone[..^4] + "XXXX";
}
