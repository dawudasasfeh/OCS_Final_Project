using Microsoft.EntityFrameworkCore;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;
using RentalMarketplaceBackend.Infrastructure.Persistence;

namespace RentalMarketplaceBackend.Infrastructure.Repositories;

public class PaymentRepository : GenericRepository<Payment>, IPaymentRepository
{
    public PaymentRepository(AppDbContext context) : base(context) { }

    public async Task<Payment?> GetWithDetailsAsync(int id) =>
       await _dbSet.Include(p => p.Payer)
                   .Include(p => p.Booking!).ThenInclude(b => b.House)
                   .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<IReadOnlyList<Payment>> GetForPayerAsync(string payerId) =>
        await _dbSet.AsNoTracking()
                    .Where(p => p.PayerId == payerId)
                    .Include(p => p.Payer)
                    .Include(p => p.Booking!).ThenInclude(b => b.House)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

    public async Task<IReadOnlyList<Payment>> GetForBookingAsync(int bookingId) =>
        await _dbSet.AsNoTracking()
                    .Where(p => p.BookingId == bookingId)
                    .Include(p => p.Payer)
                    .Include(p => p.Booking!).ThenInclude(b => b.House)
                    .OrderBy(p => p.CreatedAt)
                    .ToListAsync();

    public async Task<IReadOnlyList<Payment>> GetPendingSubscriptionsAsync() =>
        await _dbSet.AsNoTracking()
                    .Where(p => p.Purpose == PaymentPurpose.SubscriptionPayment
                             && p.Status == PaymentStatus.Pending)
                    .Include(p => p.Payer)
                    .OrderBy(p => p.CreatedAt)
                    .ToListAsync();

}
