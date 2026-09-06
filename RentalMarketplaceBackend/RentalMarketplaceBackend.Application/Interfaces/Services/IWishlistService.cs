using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Houses;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

public interface IWishlistService
{
    /// <summary>The caller's saved listings, as houses rather than wishlist rows.</summary>
    Task<IReadOnlyList<HouseDto>> GetMineAsync(string userId);

    Task<Result<int>> AddAsync(int houseId, string userId);
    Task<Result<int>> RemoveAsync(int houseId, string userId);
}
