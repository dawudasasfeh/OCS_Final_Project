using Microsoft.EntityFrameworkCore;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;
using RentalMarketplaceBackend.Infrastructure.Persistence;

namespace RentalMarketplaceBackend.Infrastructure.Repositories;

public class BookingRepository : GenericRepository<Booking>, IBookingRepository
{
    public BookingRepository(AppDbContext context) : base(context) { }
    public async Task<bool> HasOverlapAsync(int houseId, DateOnly start, DateOnly end) =>
        await _dbSet.AnyAsync(b =>
            b.HouseId == houseId &&
            b.Status != BookingStatus.Cancelled &&
            b.Status != BookingStatus.Rejected &&
            b.StartDate < end && start < b.EndDate
            );

    public async Task<Booking?> GetWithDetailsAsync(int id) =>
         await _dbSet.Include(b => b.House!).ThenInclude(h => h.Owner)
                     .Include(b => b.House!).ThenInclude(h => h.Images)
                     .Include(b => b.Renter)
                     .FirstOrDefaultAsync(b => b.Id == id);

    public async Task<IReadOnlyList<Booking>> GetForRenterAsync(string renterId) =>
        await _dbSet.AsNoTracking()
                    .Where(b => b.RenterId == renterId)
                    .Include(b => b.House!).ThenInclude(h => h.Owner)
                    .Include(b => b.House!).ThenInclude(h => h.Images)
                    .OrderByDescending(b => b.CreatedAt)
                    .ToListAsync();

    public async Task<IReadOnlyList<Booking>> GetForOwnerAsync(string ownerId) =>
        await _dbSet.AsNoTracking()
                    .Where(b => b.House!.OwnerId == ownerId)
                    .Include(b => b.House!).ThenInclude(h => h.Images)
                    .Include(b => b.Renter)
                    .OrderByDescending(b => b.CreatedAt)
                    .ToListAsync();
}
