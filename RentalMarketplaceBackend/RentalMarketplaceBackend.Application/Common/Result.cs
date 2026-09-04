namespace RentalMarketplaceBackend.Application.Common;

public record Result<T>(bool Succeeded, string? Error, T? Data)
{
    public static Result<T> Ok(T data) => new(true, null, data);
    public static Result<T> Fail(string error) => new(false, error, default);
}