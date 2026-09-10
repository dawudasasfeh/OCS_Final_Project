using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Bookings;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

public interface IBookingService
{
    /// <summary>
    /// FR-9.4.2 — isAdmin is a refusal, not a privilege. The role exists for
    /// oversight, so an administrator does not take part in bookings.
    /// </summary>
    Task<Result<BookingDto>> CreateAsync(BookingCreateDto dto, string renterId, bool isAdmin = false);

    Task<BookingDto?> GetByIdAsync(int id, string requesterId, bool isAdmin = false);
    Task<Result<AvailabilityDto>> GetAvailabilityAsync(int houseId);
    Task<IReadOnlyList<BookingDto>> GetMineAsync(string renterId);
    Task<IReadOnlyList<BookingDto>> GetRequestsAsync(string ownerId);

    Task<Result<BookingDto>> ConfirmAsync(int id, string ownerId);
    Task<Result<BookingDto>> RejectAsync(int id, string ownerId);
    Task<Result<BookingDto>> CancelAsync(int id, string renterId);
}
