using RentalMarketplaceBackend.Application.DTOs.Houses;
using RentalMarketplaceBackend.Domain.Entities;

namespace RentalMarketplaceBackend.Application.Interfaces.Repositories;

public interface IHouseRepository : IGenericRepository<House>
{
    Task<House?> GetWithDetailsAsync(int id);
    Task<IReadOnlyList<House>> SearchAsync(HouseSearchDto filter);
    Task<IReadOnlyList<House>> GetByOwnerAsync(string ownerId);
}
