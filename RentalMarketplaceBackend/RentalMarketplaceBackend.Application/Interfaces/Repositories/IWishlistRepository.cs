using RentalMarketplaceBackend.Domain.Entities;

namespace RentalMarketplaceBackend.Application.Interfaces.Repositories;

public interface IWishlistRepository : IGenericRepository<WishlistItem>
{
    /// <summary>
    /// The user's saved houses, filtered to what they could find in search
    /// anyway, so a listing rejected after being saved quietly drops out.
    /// </summary>
    Task<IReadOnlyList<House>> GetHousesForUserAsync(string userId);

    Task<bool> ExistsAsync(string userId, int houseId);

    Task<WishlistItem?> GetItemAsync(string userId, int houseId);
}
