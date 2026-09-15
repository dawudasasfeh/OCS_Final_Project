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
    /// <summary>
    /// Uploads beyond this are refused. Each photo is up to 5 MB of disk, and
    /// no one browses past thirty. Seeded listings may already hold more.
    /// </summary>
    public const int MaxImagesPerListing = 30;

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
        };

        await _uow.Houses.AddAsync(house);
        await _uow.SaveChangesAsync();

        house.Owner = owner;
        return Result<HouseDto>.Ok(HouseMapper.Map(house, includeContent: true));

    }

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

        if (house.Status != ListingStatus.Pending)
            house.Status = ListingStatus.Pending;

        await _uow.SaveChangesAsync();

        return Result<HouseDto>.Ok(HouseMapper.Map(house, includeContent: true));
    }
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

        // Checked before the file is written, so a refused upload leaves nothing
        // behind on disk.
        if (house.Images.Count >= MaxImagesPerListing)
            return Result<string>.Fail("This listing already has the maximum number of photos.");

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

        // A new photo is new content, reviewed like an edit to the text is. An
        // approved listing otherwise let its owner add anything, unmoderated.
        house.Status = ListingStatus.Pending;

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
