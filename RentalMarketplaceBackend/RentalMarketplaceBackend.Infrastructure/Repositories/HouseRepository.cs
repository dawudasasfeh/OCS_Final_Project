using Microsoft.EntityFrameworkCore;
using RentalMarketplaceBackend.Application.DTOs.Houses;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Infrastructure.Persistence;

namespace RentalMarketplaceBackend.Infrastructure.Repositories;

public class HouseRepository : GenericRepository<House>, IHouseRepository
{
    public HouseRepository(AppDbContext context) : base(context) { }

    public async Task<House?> GetWithDetailsAsync(int id) =>
        await _dbSet
            .Include(h => h.Images)
            .Include(h => h.Owner)
            .FirstOrDefaultAsync(h => h.Id == id);

    public async Task<IReadOnlyList<House>> SearchAsync(HouseSearchDto f)
    {
        var query = _dbSet.AsNoTracking()
            .Include(h => h.Images)
            .Include(h => h.Owner)
            .Where(h => h.IsAvailable);

        if (f.Status.HasValue)
            query = query.Where(h => h.Status == f.Status.Value);

        if (!string.IsNullOrWhiteSpace(f.City))
            query = query.Where(h => h.City == f.City);

        if (!string.IsNullOrWhiteSpace(f.Neighborhood))
            query = query.Where(h => h.Neighborhood == f.Neighborhood);

        if (f.PropertyType.HasValue)
            query = query.Where(h => h.PropertyType == f.PropertyType.Value);

        if (f.PriceUnit.HasValue)
            query = query.Where(h => h.PriceUnit == f.PriceUnit.Value);

        if (f.MinPrice.HasValue)
            query = query.Where(h => h.Price >= f.MinPrice.Value);

        if (f.MaxPrice.HasValue)
            query = query.Where(h => h.Price <= f.MaxPrice.Value);

        if (f.Bedrooms.HasValue)
            query = query.Where(h => h.Bedrooms >= f.Bedrooms.Value);

        if (f.Bathrooms.HasValue)
            query = query.Where(h => h.Bathrooms >= f.Bathrooms.Value);

        if (f.IsFurnished.HasValue)
            query = query.Where(h => h.IsFurnished == f.IsFurnished.Value);

        return await query.OrderByDescending(h => h.CreatedAt).ToListAsync();
    }

    public async Task<IReadOnlyList<House>> GetByOwnerAsync(string ownerId) =>
        await _dbSet.AsNoTracking()
            .Include(h => h.Images)
            .Include(h => h.Owner)
            .Where(h => h.OwnerId == ownerId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();
}
