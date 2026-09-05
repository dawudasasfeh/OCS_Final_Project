using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Bookings;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;


namespace RentalMarketplaceBackend.Application.Services;

public class BookingService : IBookingService
{
    private readonly IUnitOfWork _uow;

    public BookingService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Result<BookingDto>> CreateAsync(BookingCreateDto dto, string renterId) {
        var house = await _uow.Houses.GetByIdAsync(dto.HouseId);

        if (house is null)
            return Result<BookingDto>.Fail("Property not found.");

        if (house.Status != ListingStatus.Approved || !house.IsAvailable)
            return Result<BookingDto>.Fail("This property is not available for booking.");

        if (house.OwnerId == renterId)
            return Result<BookingDto>.Fail("You cannot book your own property.");

        if (dto.DurationType != house.PriceUnit)
            return Result<BookingDto>.Fail($"This property is rented {house.PriceUnit} only.");

        if (dto.StartDate < DateOnly.FromDateTime(DateTime.UtcNow))
            return Result<BookingDto>.Fail("Start date cannot be in the past.");

        DateOnly? endDate = dto.DurationType switch
        {
            DurationType.Weekly => dto.StartDate.AddDays(dto.DurationCount * 7),
            DurationType.Monthly => dto.StartDate.AddMonths(dto.DurationCount),
            DurationType.Yearly => dto.StartDate.AddYears(dto.DurationCount),
            _ => null
        };

        if (endDate is null)
            return Result<BookingDto>.Fail("Invalid rental period.");

        var padStart = dto.StartDate.AddDays(-house.TurnoverDays);
        var padEnd = endDate.Value.AddDays(house.TurnoverDays);

        if(await _uow.Bookings.HasOverlapAsync(house.Id, padStart, padEnd)) 
            return Result<BookingDto>.Fail("Those dates are not available.");

        var booking = new Booking
        {
            HouseId = house.Id,
            RenterId = renterId,
            StartDate = dto.StartDate,
            EndDate = endDate.Value,
            DurationType = dto.DurationType,
            DurationCount = dto.DurationCount,
            TotalPrice = house.Price * dto.DurationCount,
            Status = BookingStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.Bookings.AddAsync(booking);
        await _uow.SaveChangesAsync();

        var saved = await _uow.Bookings.GetWithDetailsAsync(booking.Id);

        return Result<BookingDto>.Ok(Map(saved!, includeContacts: false));



    }

    public async Task<BookingDto?> GetByIdAsync(int id, string requesterId, bool isAdmin = false)
    {
        var booking = await _uow.Bookings.GetWithDetailsAsync(id);
        if (booking is null) return null;

        var isRenter = booking.RenterId == requesterId;
        var isOwner = booking.House!.OwnerId == requesterId;
        if (!isRenter && !isOwner && !isAdmin) return null;

        return Map(booking, booking.Status == BookingStatus.Confirmed);
    }
    public async Task<IReadOnlyList<BookingDto>> GetMineAsync(string renterId) {
        var bookings = await _uow.Bookings.GetForRenterAsync(renterId);
        return bookings.Select(b => Map(b, b.Status == BookingStatus.Confirmed)).ToList();
    }
    public async Task<IReadOnlyList<BookingDto>> GetRequestsAsync(string ownerId)
    {
        var bookings = await _uow.Bookings.GetForOwnerAsync(ownerId);
        return bookings.Select(b => Map(b, b.Status == BookingStatus.Confirmed)).ToList();
    }
    public async Task<Result<BookingDto>> ConfirmAsync(int id, string ownerId)
    {
        var booking = await _uow.Bookings.GetWithDetailsAsync(id);
        if(booking is null)
            return Result<BookingDto>.Fail("Booking not found.");

        if(booking.House!.OwnerId != ownerId)
            return Result<BookingDto>.Fail("You do not own this property.");

        if(booking.Status != BookingStatus.Pending)
            return Result<BookingDto>.Fail($"This booking is already {booking.Status}.");

        booking.Status = BookingStatus.Confirmed;
        await _uow.SaveChangesAsync();

        return Result<BookingDto>.Ok(Map(booking, includeContacts: true));
    }
    public async Task<Result<BookingDto>> RejectAsync(int id, string ownerId) {
        var booking = await _uow.Bookings.GetWithDetailsAsync(id);
        if (booking is null)
            return Result<BookingDto>.Fail("Booking not found.");

        if (booking.House!.OwnerId != ownerId)
            return Result<BookingDto>.Fail("You do not own this property.");

        if (booking.Status != BookingStatus.Pending)
            return Result<BookingDto>.Fail($"This booking is already {booking.Status}.");

        booking.Status = BookingStatus.Rejected;
        await _uow.SaveChangesAsync();

        return Result<BookingDto>.Ok(Map(booking, booking.Status == BookingStatus.Confirmed));
    }
    public async Task<Result<BookingDto>> CancelAsync(int id, string renterId)
    {

        var booking = await _uow.Bookings.GetWithDetailsAsync(id);
        if (booking is null)
            return Result<BookingDto>.Fail("Booking not found.");

        if (booking.RenterId != renterId)
            return Result<BookingDto>.Fail("This is not your booking.");

        if (booking.Status != BookingStatus.Pending)
            return Result<BookingDto>.Fail($"This booking is already {booking.Status}.");

        booking.Status = BookingStatus.Cancelled;
        await _uow.SaveChangesAsync();

        return Result<BookingDto>.Ok(Map(booking, booking.Status == BookingStatus.Confirmed));
    }

    private static BookingDto Map(Booking b, bool includeContacts) => new()
    {
        Id = b.Id,
        StartDate = b.StartDate,
        EndDate = b.EndDate,
        LastNight = b.EndDate.AddDays(-1),
        DurationType = b.DurationType.ToString(),
        DurationCount = b.DurationCount,
        TotalPrice = b.TotalPrice,
        Status = b.Status.ToString(),
        CreatedAt = b.CreatedAt,

        HouseId = b.HouseId,
        HouseTitle = b.House?.Title ?? string.Empty,
        HouseCity = b.House?.City ?? string.Empty,
        HouseImageUrl = b.House?.Images
                        .OrderByDescending(i => i.IsPrimary)
                        .FirstOrDefault()?.ImageUrl,

        OwnerId = b.House?.OwnerId ?? string.Empty,
        OwnerName = b.House?.Owner?.FullName ?? string.Empty,
        OwnerPhone = includeContacts ? b.House?.Owner?.PhoneNumber : null,

        RenterId = b.RenterId,
        RenterName = b.Renter?.FullName ?? string.Empty,
        RenterPhone = includeContacts ? b.Renter?.PhoneNumber : null,
    };
}
