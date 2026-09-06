using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Houses;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Application.Mapping;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.Services;

public class WishlistService : IWishlistService
{
    private readonly IUnitOfWork _uow;

    public WishlistService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<IReadOnlyList<HouseDto>> GetMineAsync(string userId)
    {
        var houses = await _uow.Wishlist.GetHousesForUserAsync(userId);

        // The caller is signed in, so they see real phone numbers.
        return houses.Select(h => HouseMapper.Map(h, includeContent: true)).ToList();
    }

    public async Task<Result<int>> AddAsync(int houseId, string userId)
    {
        var house = await _uow.Houses.GetByIdAsync(houseId);

        if (house is null)
            return Result<int>.Fail("Listing not found.");

        if (house.Status != ListingStatus.Approved)
            return Result<int>.Fail("This listing is not available.");

        if (house.OwnerId == userId)
            return Result<int>.Fail("You cannot save your own listing.");

        // (UserId, HouseId) is a unique index, so a second add would throw a
        // DbUpdateException and surface as a 500. Saving twice is not an error
        // worth showing the user, so it succeeds quietly.
        if (await _uow.Wishlist.ExistsAsync(userId, houseId))
            return Result<int>.Ok(houseId);

        await _uow.Wishlist.AddAsync(new WishlistItem
        {
            UserId = userId,
            HouseId = houseId,
            CreatedAt = DateTime.UtcNow
        });

        await _uow.SaveChangesAsync();

        return Result<int>.Ok(houseId);
    }

    public async Task<Result<int>> RemoveAsync(int houseId, string userId)
    {
        var item = await _uow.Wishlist.GetItemAsync(userId, houseId);

        if (item is null)
            return Result<int>.Fail("This listing is not in your wishlist.");

        _uow.Wishlist.Delete(item);
        await _uow.SaveChangesAsync();

        return Result<int>.Ok(houseId);
    }
}
