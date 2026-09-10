using RentalMarketplaceBackend.Application.DTOs.Houses;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.Interfaces.Repositories;

public interface IHouseRepository : IGenericRepository<House>
{
    Task<House?> GetWithDetailsAsync(int id);
    /// <summary>
    /// One page of matching listings, plus how many match in total. The count
    /// is part of the same call because a pager needs both and the filter that
    /// produced one has to be the filter that produced the other.
    /// </summary>
    Task<(IReadOnlyList<House> Items, int TotalCount)> SearchAsync(HouseSearchDto filter);

    /// <summary>Available approved listings per city, for the city suggestions.</summary>
    Task<IReadOnlyDictionary<string, int>> CityCountsAsync();
    Task<IReadOnlyList<House>> GetByOwnerAsync(string ownerId);

    /// <summary>
    /// Every listing in one status, unpaged. Deliberately not the paged search:
    /// the moderation queue must never be silently cut off at a page size, and
    /// an admin who cannot see the twelfth pending listing has no way to know
    /// it is there.
    /// </summary>
    Task<IReadOnlyList<House>> GetByStatusAsync(ListingStatus status);

    /// <summary>
    /// How many listings each owner has, keyed by owner id. One grouped query,
    /// so the admin user list does not issue a count per row.
    /// </summary>
    Task<IReadOnlyDictionary<string, int>> CountByOwnerAsync();
}
