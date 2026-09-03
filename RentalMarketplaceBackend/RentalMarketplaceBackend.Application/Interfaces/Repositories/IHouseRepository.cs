using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.Interfaces.Repositories;

    public interface IHouseRepository : IGenericRepository<House>
    {
    Task<House?> GetWithImagesAsync(int id);
    Task<IReadOnlyList<House>> SearchAsync(string? city, PropertyType? type, int? bedrooms);
    Task<IReadOnlyList<House>> GetByOwnerAsync(string ownerId);
    }
