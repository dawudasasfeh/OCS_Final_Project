using System.ComponentModel.DataAnnotations;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.DTOs.Houses;

public class HouseSearchDto
{
    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? Neighborhood { get; set; }

    [EnumDataType(typeof(PropertyType))]
    public PropertyType? PropertyType { get; set; }

    [EnumDataType(typeof(DurationType))]
    public DurationType? PriceUnit { get; set; }

    [Range(0, 9999999)]
    public decimal? MinPrice { get; set; }

    [Range(0, 9999999)]
    public decimal? MaxPrice { get; set; }

    [Range(0, 50)]
    public int? Bedrooms { get; set; }

    [Range(0, 50)]
    public int? Bathrooms { get; set; }

    public bool? IsFurnished { get; set; }

    public ListingStatus? Status { get; set; }

    // ── Paging ────────────────────────────────────────────────────────
    // Both are clamped rather than rejected: a caller asking for page 0, or for
    // 5,000 rows, has made a mistake rather than an attack, and a 400 in the
    // middle of browsing is the worse answer. PageSize is capped because it is
    // the one knob a stranger could use to ask for the whole table at once.
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = DefaultPageSize;

    [EnumDataType(typeof(HouseSort))]
    public HouseSort Sort { get; set; } = HouseSort.Newest;

    public const int DefaultPageSize = 12;
    public const int MaxPageSize = 48;

    public int SafePage => Page < 1 ? 1 : Page;
    public int SafePageSize =>
        PageSize < 1 ? DefaultPageSize : PageSize > MaxPageSize ? MaxPageSize : PageSize;
}
