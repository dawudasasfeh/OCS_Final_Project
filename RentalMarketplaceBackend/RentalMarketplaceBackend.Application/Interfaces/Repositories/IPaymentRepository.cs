using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.Interfaces.Repositories;

public interface IPaymentRepository : IGenericRepository<Payment>
{
    Task<Payment?> GetWithDetailsAsync(int id);
    Task<IReadOnlyList<Payment>> GetForPayerAsync(string payerId);
    Task<IReadOnlyList<Payment>> GetForBookingAsync(int bookingId);
    Task<IReadOnlyList<Payment>> GetPendingSubscriptionsAsync();
}
