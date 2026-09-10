namespace RentalMarketplaceBackend.Application.DTOs.Houses;

/// <summary>
/// Sorting moved to the server when the search became paged. It had to: sorting
/// twelve rows the server already chose is not sorting the results, it is
/// shuffling one page, and "cheapest first" would have meant "cheapest of the
/// twelve newest".
/// </summary>
public enum HouseSort
{
    Newest = 0,
    PriceAsc = 1,
    PriceDesc = 2,
    AreaDesc = 3
}
