using RentalMarketplaceBackend.Application.DTOs.Houses;
using RentalMarketplaceBackend.Domain.Entities;

namespace RentalMarketplaceBackend.Application.Interfaces.Repositories;

public interface IHouseRepository : IGenericRepository<House>
{
    Task<House?> GetWithDetailsAsync(int id);
    Task<IReadOnlyList<House>> SearchAsync(HouseSearchDto filter);
    Task<IReadOnlyList<House>> GetByOwnerAsync(string ownerId);

    /// <summary>
    /// How many listings each owner has, keyed by owner id. One grouped query,
    /// so the admin user list does not issue a count per row.
    /// </summary>
    Task<IReadOnlyDictionary<string, int>> CountByOwnerAsync();
}
