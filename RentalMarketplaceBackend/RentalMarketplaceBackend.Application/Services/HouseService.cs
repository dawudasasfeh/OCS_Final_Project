using Microsoft.AspNetCore.Identity;
using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Houses;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Application.Mapping;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;



namespace RentalMarketplaceBackend.Application.Services;

public class HouseService : IHouseService
{
    private readonly IUnitOfWork _uow;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IFileStorageService _files;
    private readonly ISubscriptionService _subscriptions;

    public HouseService(IUnitOfWork uow, UserManager<ApplicationUser> userManager, IFileStorageService files, ISubscriptionService subscriptions)
    {
        _uow = uow;
        _userManager = userManager;
        _files = files;
        _subscriptions = subscriptions;
    }

    public async Task<PagedResult<HouseDto>> SearchAsync(HouseSearchDto filter)
    {
        // Forced, not defaulted: the public search shows approved listings and
        // nothing else, so a caller cannot ask for pending ones by adding
        // ?status=1 to the query string.
        filter.Status = ListingStatus.Approved;

        var (houses, total) = await _uow.Houses.SearchAsync(filter);
        var items = houses.Select(h => HouseMapper.Map(h)).ToList();

        return new PagedResult<HouseDto>(items, filter.SafePage, filter.SafePageSize, total);
    }

    public Task<IReadOnlyDictionary<string, int>> GetCityCountsAsync() =>
        _uow.Houses.CityCountsAsync();

    public async Task<HouseDto?> GetByIdAsync(int id, string? requesterId = null, bool isAdmin = false){
        var house = await _uow.Houses.GetWithDetailsAsync(id);
        if (house is null) return null;

        var isOwner = requesterId is not null && house.OwnerId == requesterId;
        var canSee = house.Status == ListingStatus.Approved || isOwner || isAdmin;

        if (!canSee) return null;

        return HouseMapper.Map(house, includeContent: requesterId is not null);
    }

    public async Task<IReadOnlyList<HouseDto>> GetMineAsync(string ownerId){
        var houses = await _uow.Houses.GetByOwnerAsync(ownerId);
        return houses.Select(h => HouseMapper.Map(h, includeContent: true)).ToList();
    }

    public async Task<Result<HouseDto>> CreateAsync(HouseCreateDto dto, string ownerId, bool isAdmin = false){
        var owner = await _userManager.FindByIdAsync(ownerId);
        if (owner is null)
            return Result<HouseDto>.Fail("Account not found.");

        // FR-9.4.2 — the Admin role is oversight only. An admin who published a
        // listing would be the person who approves it, which is the one
        // separation this system exists to keep: an owner cannot approve their
        // own listing, a renter cannot confirm their own payment. Exempting the
        // admin from the fee was the earlier answer and it was the wrong one —
        // it made the moderator a seller.
        if (isAdmin)
            return Result<HouseDto>.Fail("Administrators cannot publish listings.");

        if (!await _subscriptions.IsActiveAsync(ownerId))
            return Result<HouseDto>.Fail("An active subscription is required to publish a listing.");

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
        return Result<HouseDto>.Ok(HouseMapper.Map(house, includeContent: true));

    }

    /// <summary>
    /// FR-2.7 / FR-2.10 — an owner edits their own listing, and only their own.
    ///
    /// Ownership is read from the token by the controller and compared here, so
    /// the request body cannot claim it. HouseUpdateDto has no OwnerId and no
    /// Status field at all, which is why neither needs validating away.
    /// </summary>
    public async Task<Result<HouseDto>> UpdateAsync(int id, HouseUpdateDto dto, string requesterId)
    {
        var house = await _uow.Houses.GetWithDetailsAsync(id);
        if (house is null)
            return Result<HouseDto>.Fail("Listing not found.");

        if (house.OwnerId != requesterId)
            return Result<HouseDto>.Fail("You do not own this listing.");

        house.Title = dto.Title;
        house.Description = dto.Description;
        house.PropertyType = dto.PropertyType;
        house.Address = dto.Address;
        house.City = dto.City;
        house.Neighborhood = dto.Neighborhood;
        house.Price = dto.Price;
        house.PriceUnit = dto.PriceUnit;
        house.Bedrooms = dto.Bedrooms;
        house.Bathrooms = dto.Bathrooms;
        house.AreaSqM = dto.AreaSqM;
        house.IsFurnished = dto.IsFurnished;
        house.FloorNumber = dto.FloorNumber;
        house.MasterBedrooms = dto.MasterBedrooms;
        house.ApartmentsInBuilding = dto.ApartmentsInBuilding;
        house.BuildingAge = dto.BuildingAge;
        house.TurnoverDays = dto.TurnoverDays;

        // An edited listing goes back into the queue. Otherwise an owner could
        // get a modest flat approved and then rewrite it into something else,
        // and moderation would have approved a listing that no longer exists.
        // A rejected listing returns to Pending for the opposite reason: the
        // edit is how an owner answers the rejection.
        if (house.Status != ListingStatus.Pending)
            house.Status = ListingStatus.Pending;

        await _uow.SaveChangesAsync();

        return Result<HouseDto>.Ok(HouseMapper.Map(house, includeContent: true));
    }

    /// <summary>
    /// FR-2.8 — take a property off the market without deleting it.
    ///
    /// Existing bookings are deliberately untouched. Delisting says "no new
    /// requests", not "the stays I already agreed are off" — those are a
    /// commitment to a renter and are cancelled through the booking, not by
    /// withdrawing the listing underneath them.
    ///
    /// Status is untouched too: an approved listing that is delisted is still
    /// approved, and relisting it should not send it back through moderation.
    /// </summary>
    public async Task<Result<HouseDto>> SetAvailabilityAsync(int id, bool isAvailable, string requesterId)
    {
        var house = await _uow.Houses.GetWithDetailsAsync(id);
        if (house is null)
            return Result<HouseDto>.Fail("Listing not found.");

        if (house.OwnerId != requesterId)
            return Result<HouseDto>.Fail("You do not own this listing.");

        if (house.IsAvailable == isAvailable)
            return Result<HouseDto>.Fail(isAvailable
                ? "This listing is already available."
                : "This listing is already delisted.");

        house.IsAvailable = isAvailable;
        await _uow.SaveChangesAsync();

        return Result<HouseDto>.Ok(HouseMapper.Map(house, includeContent: true));
    }

    public async Task<IReadOnlyList<HouseDto>> GetPendingAsync()
    {
        var houses = await _uow.Houses.GetByStatusAsync(ListingStatus.Pending);
        return houses.Select(h => HouseMapper.Map(h, includeContent: true)).ToList();
    }

    public async Task<Result<string>> AddImageAsync(
        int houseId, string requesterId,
        Stream content, string fileName, string contentType, long lengthInBytes)
    {
        var house = await _uow.Houses.GetWithDetailsAsync(houseId);

        if (house is null)
            return Result<string>.Fail("Listing not found.");

        if (house.OwnerId != requesterId)
            return Result<string>.Fail("You do not own this listing.");

        var saved = await _files.SaveHouseImageAsync(
            houseId, content, fileName, contentType, lengthInBytes);

        if (!saved.Succeeded)
            return saved;

        // The first image a listing gets is its main photo. Reordering later is
        // the client's business; the server only records which one is primary.
        house.Images.Add(new HouseImage
        {
            ImageUrl = saved.Data!,
            IsPrimary = house.Images.Count == 0
        });

        await _uow.SaveChangesAsync();

        return saved;
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

        return Result<HouseDto>.Ok(HouseMapper.Map(house, includeContent: true));
    }
}
