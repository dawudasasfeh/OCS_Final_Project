using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Payments;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.Services;

public class PaymentService : IPaymentService
{

    private readonly IUnitOfWork _uow;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;
    private readonly ISubscriptionService _subscriptions;

    public PaymentService(IUnitOfWork uow, UserManager<ApplicationUser> userManager, IConfiguration config, ISubscriptionService subscriptions)
    {
        _uow = uow;
        _userManager = userManager;
        _config = config;
        _subscriptions = subscriptions;
    }

    private decimal SubscriptionPrice =>
       decimal.TryParse(_config["Subscription:PricePerMonth"], out var p) ? p : 20m;


    public async Task<Result<PaymentDto>> CreateBookingPaymentAsync(BookingPaymentCreateDto dto, string payerId) {
        var booking = await _uow.Bookings.GetWithDetailsAsync(dto.BookingId);

        if (booking is null)
            return Result<PaymentDto>.Fail("Booking not found.");

        if (booking.RenterId != payerId)
            return Result<PaymentDto>.Fail("This is not your booking.");

        if (booking.Status != BookingStatus.Confirmed)
            return Result<PaymentDto>.Fail(
                "You can only record a payment once the owner has confirmed the booking.");

        var payment = new Payment
        {
            Amount = dto.Amount,
            Purpose = PaymentPurpose.BookingPayment,
            Method = dto.Method,
            Status = PaymentStatus.Pending,
            ReferenceNote = dto.ReferenceNote?.Trim(),
            CreatedAt = DateTime.UtcNow,
            PayerId = payerId,
            BookingId = booking.Id
        };

        await _uow.Payments.AddAsync(payment);
        await _uow.SaveChangesAsync();

        payment.Payer = booking.Renter;
        payment.Booking = booking;

        return Result<PaymentDto>.Ok(Map(payment));
    }
    public async Task<Result<PaymentDto>> CreateSubscriptionPaymentAsync(SubscriptionPaymentCreateDto dto, string payerId) {
        var user = await _userManager.FindByIdAsync(payerId);

        if (user is null)
            return Result<PaymentDto>.Fail("Account not found.");

        var payment = new Payment
        {
            Amount = SubscriptionPrice,     
            Purpose = PaymentPurpose.SubscriptionPayment,
            Method = dto.Method,
            Status = PaymentStatus.Pending,
            ReferenceNote = dto.ReferenceNote?.Trim(),
            CreatedAt = DateTime.UtcNow,
            PayerId = payerId,
            BookingId = null
        };

        await _uow.Payments.AddAsync(payment);
        await _uow.SaveChangesAsync();

        payment.Payer = user;

        return Result<PaymentDto>.Ok(Map(payment));
    }
    public async Task<IReadOnlyList<PaymentDto>> GetMineAsync(string payerId) {
        var payments = await _uow.Payments.GetForPayerAsync(payerId);
        return payments.Select(Map).ToList();
    }
    public async Task<Result<IReadOnlyList<PaymentDto>>> GetForBookingAsync(int bookingId, string requesterId, bool isAdmin = false) {
        var booking = await _uow.Bookings.GetWithDetailsAsync(bookingId);

        if (booking is null)
            return Result<IReadOnlyList<PaymentDto>>.Fail("Booking not found.");

        var isRenter = booking.RenterId == requesterId;
        var isOwner = booking.House?.OwnerId == requesterId;

        if (!isRenter && !isOwner && !isAdmin)
            return Result<IReadOnlyList<PaymentDto>>.Fail("Booking not found.");

        var payments = await _uow.Payments.GetForBookingAsync(bookingId);

        return Result<IReadOnlyList<PaymentDto>>.Ok(payments.Select(Map).ToList());

    }
    public async Task<IReadOnlyList<PaymentDto>> GetPendingSubscriptionsAsync() {
        var payments = await _uow.Payments.GetPendingSubscriptionsAsync();
        return payments.Select(Map).ToList();
    }
    public Task<Result<PaymentDto>> ConfirmAsync(int id, string requesterId, bool isAdmin = false)
       => ReviewAsync(id, PaymentStatus.Confirmed, requesterId, isAdmin);

    public Task<Result<PaymentDto>> RejectAsync(int id, string requesterId, bool isAdmin = false)
        => ReviewAsync(id, PaymentStatus.Rejected, requesterId, isAdmin);

    private async Task<Result<PaymentDto>> ReviewAsync(int id, PaymentStatus status, string requesterId, bool isAdmin)
    {
        var payment = await _uow.Payments.GetWithDetailsAsync(id);

        if (payment is null)
            return Result<PaymentDto>.Fail("Payment not found.");

        if (payment.Status != PaymentStatus.Pending)
            return Result<PaymentDto>.Fail(
                $"This payment is already {payment.Status.ToString().ToLower()}.");

        var allowed = payment.Purpose switch
        {
            PaymentPurpose.BookingPayment =>
                isAdmin || payment.Booking?.House?.OwnerId == requesterId,
            PaymentPurpose.SubscriptionPayment => isAdmin,
            _ => false
        };

        if (!allowed)
            return Result<PaymentDto>.Fail("You cannot decide on this payment.");

        payment.Status = status;
        payment.ConfirmedAt = status == PaymentStatus.Confirmed ? DateTime.UtcNow : null;

        if (status == PaymentStatus.Confirmed &&
            payment.Purpose == PaymentPurpose.SubscriptionPayment)
        {
            var granted = await _subscriptions.GrantAsync(payment.PayerId);
            if (!granted.Succeeded)
                return Result<PaymentDto>.Fail(granted.Error!);
        }

        await _uow.SaveChangesAsync();

        return Result<PaymentDto>.Ok(Map(payment));
    }

    private static PaymentDto Map(Payment p) => new()
    {
        Id = p.Id,
        Amount = p.Amount,
        Purpose = p.Purpose.ToString(),
        Method = p.Method.ToString(),
        Status = p.Status.ToString(),
        ReferenceNote = p.ReferenceNote,
        CreatedAt = p.CreatedAt,
        ConfirmedAt = p.ConfirmedAt,
        PayerId = p.PayerId,
        PayerName = p.Payer?.FullName ?? string.Empty,
        BookingId = p.BookingId,
        HouseTitle = p.Booking?.House?.Title
    };
}
