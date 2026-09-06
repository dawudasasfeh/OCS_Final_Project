using System.ComponentModel.DataAnnotations;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.DTOs.Payments;

public class BookingPaymentCreateDto
{
    [Range(1, int.MaxValue)]
    public int BookingId { get; set; }

    [Range(0.01, 9999999)]
    public decimal Amount { get; set; }

    [EnumDataType(typeof(PaymentMethod))]
    public PaymentMethod Method { get; set; }

    [MaxLength(250)]
    public string? ReferenceNote { get; set; }
}

