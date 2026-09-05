using Microsoft.AspNetCore.Identity;
using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Houses;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;
using static System.Net.WebRequestMethods;


namespace RentalMarketplaceBackend.Application.Services;

public class HouseService : IHouseService
{
    private readonly IUnitOfWork _uow;
    private readonly UserManager<ApplicationUser> _userManager;

    public HouseService(IUnitOfWork uow, UserManager<ApplicationUser> userManager)
    {
        _uow = uow;
        _userManager = userManager;
    }

    public async Task<IReadOnlyList<HouseDto>> SearchAsync(HouseSearchDto filter) {
        filter.Status = ListingStatus.Approved;
        var houses = await _uow.Houses.SearchAsync(filter);
        return houses.Select(h => Map(h)).ToList();
    }

    public async Task<HouseDto?> GetByIdAsync(int id, string? requesterId = null, bool isAdmin = false){
        var house = await _uow.Houses.GetWithDetailsAsync(id);
        if (house is null) return null;

        var isOwner = requesterId is not null && house.OwnerId == requesterId;
        var canSee = house.Status == ListingStatus.Approved || isOwner || isAdmin;

        if (!canSee) return null;

        return Map(house, includeContent: requesterId is not null);
    }

    public async Task<IReadOnlyList<HouseDto>> GetMineAsync(string ownerId){
        var houses = await _uow.Houses.GetByOwnerAsync(ownerId);
        return houses.Select(h => Map(h, includeContent: true)).ToList();
    }

    public async Task<Result<HouseDto>> CreateAsync(HouseCreateDto dto, string ownerId){
        var owner = await _userManager.FindByIdAsync(ownerId);
        if (owner is null)
            return Result<HouseDto>.Fail("Account not found.");

        // TODO: enable once the admin subscription toggle exists
        // if (!owner.IsSubscribed)
        //     return Result<HouseDto>.Fail("An active subscription is required to publish a listing.");

        var house = new House
        {
            Title = dto.Title,
            Description = dto.Description,
            PropertyType = dto.PropertyType,
            Address = dto.Address,
            City = dto.City,
            Neighborhood = dto.Neighborhood,
            Price = dto.Price,
            PriceUnit = dto.PriceUnit,
            Bedrooms = dto.Bedrooms,
            Bathrooms = dto.Bathrooms,
            AreaSqM = dto.AreaSqM,
            IsFurnished = dto.IsFurnished,
            FloorNumber = dto.FloorNumber,
            MasterBedrooms = dto.MasterBedrooms,
            ApartmentsInBuilding = dto.ApartmentsInBuilding,
            BuildingAge = dto.BuildingAge,
            TurnoverDays = dto.TurnoverDays,
            OwnerId = ownerId,
            Status = ListingStatus.Pending,
            IsAvailable = true,
            Images = dto.ImageUrls.Select((url, i) => new HouseImage
            {
                ImageUrl = url,
                IsPrimary = i == 0
            }).ToList()
        };

        await _uow.Houses.AddAsync(house);
        await _uow.SaveChangesAsync();

        house.Owner = owner;
        return Result<HouseDto>.Ok(Map(house, includeContent: true));

    }

    public async Task<IReadOnlyList<HouseDto>> GetPendingAsync(){
        var houses = await _uow.Houses.SearchAsync(
            new HouseSearchDto { Status = ListingStatus.Pending });
        return houses.Select(h => Map(h, includeContent: true)).ToList();
    }

    public Task<Result<HouseDto>> ApproveAsync(int id) => ReviewAsync(id, ListingStatus.Approved);
    public Task<Result<HouseDto>> RejectAsync(int id) => ReviewAsync(id, ListingStatus.Rejected);

    private async Task<Result<HouseDto>> ReviewAsync(int id, ListingStatus status) { 
        var house = await _uow.Houses.GetWithDetailsAsync(id);
        if(house is null) 
            return Result<HouseDto>.Fail("Listing not found.");

        if (house.Status == status)
            return Result<HouseDto>.Fail($"This listing is already {status.ToString().ToLower()}.");

        house.Status = status;
        await _uow.SaveChangesAsync();

        return Result<HouseDto>.Ok(Map(house, includeContent: true));
    }

    private static string? MaskPhone(string? phone) =>
        string.IsNullOrEmpty(phone) ? null
        : phone.Length <= 4 ? new string('X', phone.Length)
        : phone[..^4] + "XXXX";

    private static HouseDto Map(House h, bool includeContent = false) => new()
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

}
