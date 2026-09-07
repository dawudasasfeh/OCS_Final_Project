using System.Text.Json.Serialization;

namespace RentalMarketplaceBackend.Infrastructure.Persistence;

/// <summary>
/// The shape of seed-data.json. Records reference each other by string key,
/// because the database assigns the ids.
/// </summary>
public class SeedData
{
    public List<SeedUser> Users { get; set; } = [];
    public List<SeedHouse> Houses { get; set; } = [];
    public List<SeedBooking> Bookings { get; set; } = [];
    public List<SeedPayment> Payments { get; set; } = [];
    public List<SeedTestimonial> Testimonials { get; set; } = [];
    public List<SeedWishlistItem> Wishlist { get; set; } = [];
}

public class SeedUser
{
    public string Key { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string Role { get; set; } = "User";

    /// <summary>
    /// null never subscribed · 1 active for a month · -1 lapsed a month ago.
    /// A negative value is deliberate: it leaves IsSubscribed true with an
    /// expiry in the past, which is exactly the drift the date check exists to
    /// catch.
    /// </summary>
    public int? SubscriptionMonths { get; set; }
}

public class SeedHouse
{
    public string Key { get; set; } = "";
    public string OwnerKey { get; set; } = "";
    public string Status { get; set; } = "Pending";
    public bool IsAvailable { get; set; } = true;

    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public int PropertyType { get; set; }
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public string? Neighborhood { get; set; }
    public decimal Price { get; set; }
    public int PriceUnit { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public double AreaSqM { get; set; }
    public bool IsFurnished { get; set; }
    public int? FloorNumber { get; set; }
    public int? MasterBedrooms { get; set; }
    public int? ApartmentsInBuilding { get; set; }
    public int? BuildingAge { get; set; }
    public int TurnoverDays { get; set; }

    /// <summary>Kept for the image generator; nothing in the app reads it.</summary>
    [JsonPropertyName("imagePrompt")]
    public string? ImagePrompt { get; set; }
}

public class SeedBooking
{
    public string Key { get; set; } = "";
    public string HouseKey { get; set; } = "";
    public string RenterKey { get; set; } = "";
    public string StartDate { get; set; } = "";
    public int DurationCount { get; set; }
    public int DurationType { get; set; }
    public string Status { get; set; } = "Pending";
}

public class SeedPayment
{
    public string Key { get; set; } = "";
    public string Purpose { get; set; } = "";
    public string? BookingKey { get; set; }
    public string PayerKey { get; set; } = "";
    public decimal Amount { get; set; }
    public int Method { get; set; }
    public string Status { get; set; } = "Pending";
    public string? ReferenceNote { get; set; }
}

public class SeedTestimonial
{
    public string Key { get; set; } = "";
    public string UserKey { get; set; } = "";
    public string Content { get; set; } = "";
    public string Status { get; set; } = "Pending";
}

public class SeedWishlistItem
{
    public string UserKey { get; set; } = "";
    public string HouseKey { get; set; } = "";
}
