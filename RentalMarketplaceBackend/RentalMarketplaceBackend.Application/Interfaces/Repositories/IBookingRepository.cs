using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.Interfaces.Repositories
{
    public interface IBookingRepository : IGenericRepository<Booking>
    {
        Task<bool> HasOverlapAsync(int houseId, DateOnly start, DateOnly end);
        Task<IReadOnlyList<Booking>> GetForRenterAsync(string renterId);
        Task<IReadOnlyList<Booking>> GetForOwnerAsync(string ownerId);
    }
}
