namespace RentalMarketplaceBackend.Application.DTOs.Bookings;

public class BookingDto
{
    public int Id { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }     
    public DateOnly LastNight { get; set; } 
    public int DurationCount { get; set; }
    public string DurationType { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public int HouseId { get; set; }
    public string HouseTitle { get; set; } = string.Empty;
    public string HouseCity { get; set; } = string.Empty;
    public string? HouseImageUrl { get; set; }

    public string OwnerId { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string? OwnerPhone { get; set; }

    public string RenterId { get; set; } = string.Empty;
    public string RenterName { get; set; } = string.Empty;
    public string? RenterPhone { get; set; }
}
