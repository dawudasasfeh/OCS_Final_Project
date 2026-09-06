using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Payments;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

public interface IPaymentService
{
    Task<Result<PaymentDto>> CreateBookingPaymentAsync(BookingPaymentCreateDto dto, string payerId);
    Task<Result<PaymentDto>> CreateSubscriptionPaymentAsync(SubscriptionPaymentCreateDto dto, string payerId);
    Task<IReadOnlyList<PaymentDto>> GetMineAsync(string payerId);
    Task<Result<IReadOnlyList<PaymentDto>>> GetForBookingAsync(int bookingId, string requesterId, bool isAdmin = false);
    Task<IReadOnlyList<PaymentDto>> GetPendingSubscriptionsAsync();
    Task<Result<PaymentDto>> ConfirmAsync(int id, string requesterId, bool isAdmin = false);
    Task<Result<PaymentDto>> RejectAsync(int id, string requesterId, bool isAdmin = false);
}