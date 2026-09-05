using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Bookings;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

public interface IBookingService
{
    Task<Result<BookingDto>> CreateAsync(BookingCreateDto dto, string renterId);

    Task<BookingDto?> GetByIdAsync(int id, string requesterId, bool isAdmin = false);

    Task<IReadOnlyList<BookingDto>> GetMineAsync(string renterId);
    Task<IReadOnlyList<BookingDto>> GetRequestsAsync(string ownerId);

    Task<Result<BookingDto>> ConfirmAsync(int id, string ownerId);
    Task<Result<BookingDto>> RejectAsync(int id, string ownerId);
    Task<Result<BookingDto>> CancelAsync(int id, string renterId);
}
