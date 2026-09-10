using Microsoft.EntityFrameworkCore;
using RentalMarketplaceBackend.Application.DTOs.Houses;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;
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

    public async Task<(IReadOnlyList<House> Items, int TotalCount)> SearchAsync(HouseSearchDto f)
    {
        var query = _dbSet.AsNoTracking().Where(h => h.IsAvailable);

        query = ApplyFilters(query, f);

        // Counted before Skip/Take and without the Includes: this is one
        // COUNT(*) over the filtered set, not the rows themselves, so asking
        // "how many pages" does not cost a second copy of the page.
        var total = await query.CountAsync();

        var items = await ApplySort(query, f.Sort)
            .Include(h => h.Images)
            .Include(h => h.Owner)
            .Skip((f.SafePage - 1) * f.SafePageSize)
            .Take(f.SafePageSize)
            .ToListAsync();

        return (items, total);
    }

    /// <summary>
    /// How many available, approved listings sit in each city. Feeds the city
    /// suggestions, which used to be counted from a full download of every
    /// listing — harmless at twenty rows and indefensible past a few hundred.
    /// </summary>
    public async Task<IReadOnlyDictionary<string, int>> CityCountsAsync() =>
        await _dbSet.AsNoTracking()
            .Where(h => h.IsAvailable && h.Status == ListingStatus.Approved && h.City != null)
            .GroupBy(h => h.City)
            .Select(g => new { City = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.City, x => x.Count);

    public async Task<IReadOnlyDictionary<string, int>> CountByOwnerAsync() =>
        await _dbSet
            .AsNoTracking()
            .GroupBy(h => h.OwnerId)
            .Select(g => new { OwnerId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.OwnerId, x => x.Count);

    public async Task<IReadOnlyList<House>> GetByOwnerAsync(string ownerId) =>
        await _dbSet.AsNoTracking()
            .Include(h => h.Images)
            .Include(h => h.Owner)
            .Where(h => h.OwnerId == ownerId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();

    public async Task<IReadOnlyList<House>> GetByStatusAsync(ListingStatus status) =>
        await _dbSet.AsNoTracking()
            .Include(h => h.Images)
            .Include(h => h.Owner)
            .Where(h => h.Status == status)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();

    private static IQueryable<House> ApplyFilters(IQueryable<House> query, HouseSearchDto f)
    {
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

        return query;
    }

    /// <summary>
    /// A weekly 175 and a yearly 35,000 are not comparable as raw numbers, so
    /// price sorting normalises both to a monthly figure first. This used to
    /// happen in the browser, which was fine only while the browser held every
    /// listing; it now has to be a CASE expression the database can order by.
    ///
    /// Every branch ends on Id. Skip/Take over a non-unique ordering is how a
    /// listing shows up on both page 2 and page 3 while another never appears
    /// at all — ties have to be broken by something unique.
    /// </summary>
    private static IQueryable<House> ApplySort(IQueryable<House> query, HouseSort sort) => sort switch
    {
        HouseSort.PriceAsc => query
            .OrderBy(h => h.Price * (h.PriceUnit == DurationType.Weekly ? 4.345m
                                   : h.PriceUnit == DurationType.Yearly ? 0.0833m
                                   : 1m))
            .ThenBy(h => h.Id),

        HouseSort.PriceDesc => query
            .OrderByDescending(h => h.Price * (h.PriceUnit == DurationType.Weekly ? 4.345m
                                             : h.PriceUnit == DurationType.Yearly ? 0.0833m
                                             : 1m))
            .ThenBy(h => h.Id),

        HouseSort.AreaDesc => query.OrderByDescending(h => h.AreaSqM).ThenBy(h => h.Id),

        _ => query.OrderByDescending(h => h.CreatedAt).ThenByDescending(h => h.Id),
    };
}
