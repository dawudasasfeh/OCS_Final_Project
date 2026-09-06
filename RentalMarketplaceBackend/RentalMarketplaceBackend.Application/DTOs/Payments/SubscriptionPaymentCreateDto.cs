using RentalMarketplaceBackend.Domain.Enums;
using System.ComponentModel.DataAnnotations;

public class SubscriptionPaymentCreateDto
{
    [EnumDataType(typeof(PaymentMethod))]
    public PaymentMethod Method { get; set; }

    [MaxLength(250)]
    public string? ReferenceNote { get; set; }
}