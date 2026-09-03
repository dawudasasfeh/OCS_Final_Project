using Microsoft.EntityFrameworkCore;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;
using RentalMarketplaceBackend.Infrastructure.Persistence;


namespace RentalMarketplaceBackend.Infrastructure.Repositories;

public class HouseRepository : GenericRepository<House>, IHouseRepository 
{
    public HouseRepository(AppDbContext context) : base(context) { }
    public async Task<House?> GetWithImagesAsync(int id) =>
        await _dbSet.Include(h => h.Images)
                    .FirstOrDefaultAsync(h => h.Id == id);
    public async Task<IReadOnlyList<House>> SearchAsync(string? city, PropertyType? type, int? bedrooms) {
        var query = _dbSet.AsNoTracking().Where(h => h.IsAvailable);

        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(h => h.City == city);

        if(type.HasValue)
            query = query.Where(h => h.PropertyType == type);

        if(bedrooms.HasValue)
            query = query.Where(h => h.Bedrooms >= bedrooms);

        return await query.Include(h => h.Images).ToListAsync();

    }
    public async Task<IReadOnlyList<House>> GetByOwnerAsync(string ownerId) =>
        await _dbSet.AsNoTracking()
                    .Where(h => h.OwnerId == ownerId)
                    .Include(h => h.Images)
                    .ToListAsync();
}
