using RentalMarketplaceBackend.Application.Common;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

public interface IFileStorageService
{
    /// <summary>
    /// Saves an image into the given house's own folder and returns the path to
    /// store on the listing, for example "/uploads/houses/12/9f2c....jpg".
    ///
    /// Takes a plain stream rather than IFormFile so that nothing below the API
    /// layer has to know about ASP.NET Core's HTTP types.
    /// </summary>
    Task<Result<string>> SaveHouseImageAsync(
        int houseId,
        Stream content,
        string originalFileName,
        string contentType,
        long lengthInBytes);

    /// <summary>
    /// Removes a house's entire image folder. Safe to call when it does not exist.
    /// </summary>
    void DeleteHouseFolder(int houseId);
}
