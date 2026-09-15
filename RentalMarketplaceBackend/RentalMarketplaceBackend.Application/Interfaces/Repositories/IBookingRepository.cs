using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.Interfaces.Repositories;

public interface IBookingRepository : IGenericRepository<Booking>
{
    Task<bool> HasOverlapAsync(int houseId, DateOnly start, DateOnly end);
    /// <summary>Pending requests by this renter, optionally for one house only.</summary>
    Task<int> CountPendingForRenterAsync(string renterId, int? houseId = null);
    Task<Booking?> GetWithDetailsAsync(int id);
    Task<IReadOnlyList<Booking>> GetBlockingForHouseAsync(int houseId);
    Task<IReadOnlyList<Booking>> GetForRenterAsync(string renterId);
    Task<IReadOnlyList<Booking>> GetForOwnerAsync(string ownerId);
}
