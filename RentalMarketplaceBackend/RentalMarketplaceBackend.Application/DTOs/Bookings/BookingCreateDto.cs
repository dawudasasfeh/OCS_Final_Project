using RentalMarketplaceBackend.Domain.Enums;
using System.ComponentModel.DataAnnotations;


namespace RentalMarketplaceBackend.Application.DTOs.Bookings;

public class BookingCreateDto
{
    [Range(1, int.MaxValue)]
    public int HouseId { get; set; }

    [Required]
    public DateOnly StartDate { get; set; }

    [Range(1, 60)]
    public int DurationCount { get; set; }

    [EnumDataType(typeof(DurationType))]
    public DurationType DurationType { get; set; }
}
