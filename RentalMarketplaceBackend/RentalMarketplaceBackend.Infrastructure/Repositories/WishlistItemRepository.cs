using Microsoft.EntityFrameworkCore;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;
using RentalMarketplaceBackend.Infrastructure.Persistence;

namespace RentalMarketplaceBackend.Infrastructure.Repositories;

public class WishlistItemRepository : GenericRepository<WishlistItem>, IWishlistRepository
{
    public WishlistItemRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<House>> GetHousesForUserAsync(string userId)
    {
        // Every Include has to come before any Select: once the query projects
        // to a different entity, EF has no navigation left to include from.
        var items = await _dbSet.AsNoTracking()
            .Where(w => w.UserId == userId)
            .Include(w => w.House!).ThenInclude(h => h.Images)
            .Include(w => w.House!).ThenInclude(h => h.Owner)
            .OrderByDescending(w => w.CreatedAt)        // most recently saved first
            .ToListAsync();

        return items
            .Select(w => w.House!)
            .Where(h => h.Status == ListingStatus.Approved && h.IsAvailable)
            .ToList();
    }

    public async Task<bool> ExistsAsync(string userId, int houseId) =>
        await _dbSet.AnyAsync(w => w.UserId == userId && w.HouseId == houseId);

    // Tracking, because the caller removes what this returns.
    public async Task<WishlistItem?> GetItemAsync(string userId, int houseId) =>
        await _dbSet.FirstOrDefaultAsync(w => w.UserId == userId && w.HouseId == houseId);
}
