namespace RentalMarketplaceBackend.Application.DTOs.Bookings;
public class AvailabilityDto
{
    public int HouseId { get; set; }
    public int TurnoverDays { get; set; }

    public List<BookedIntervalDto> Booked { get; set; } = [];
}

public class BookedIntervalDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public string Status { get; set; } = "";
}