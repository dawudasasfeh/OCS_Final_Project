namespace RentalMarketplaceBackend.Application.Common;

/// <summary>
/// One page of results plus what the caller needs to draw a pager.
///
/// TotalCount is the size of the whole matching set, not of Items — a client
/// cannot work out how many pages there are from a page of twelve, and
/// "next page" alone gives no way to jump or to say "page 3 of 9".
/// </summary>
public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPrevious => Page > 1;
    public bool HasNext => Page < TotalPages;

    public static PagedResult<T> Empty(int page, int pageSize) =>
        new(Array.Empty<T>(), page, pageSize, 0);
}
