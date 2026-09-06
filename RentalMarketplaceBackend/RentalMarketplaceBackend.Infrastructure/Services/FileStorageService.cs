using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.Interfaces.Services;

namespace RentalMarketplaceBackend.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];

    private readonly string _rootOnDisk;
    private readonly string _publicRoot;
    private readonly long _maxBytes;

    public FileStorageService(IHostEnvironment env, IConfiguration config)
    {
        var folder = (config["FileStorage:HouseImagesFolder"] ?? "uploads/houses").Trim('/');

        _publicRoot = "/" + folder;
        _rootOnDisk = Path.Combine(
            env.ContentRootPath,
            "wwwroot",
            folder.Replace('/', Path.DirectorySeparatorChar));

        _maxBytes = long.TryParse(config["FileStorage:MaxBytes"], out var max)
            ? max
            : 5 * 1024 * 1024;
    }

    public async Task<Result<string>> SaveHouseImageAsync(
        int houseId, Stream content, string originalFileName, string contentType, long lengthInBytes)
    {
        if (lengthInBytes <= 0)
            return Result<string>.Fail("The file is empty.");

        if (lengthInBytes > _maxBytes)
            return Result<string>.Fail($"Images must be {_maxBytes / (1024 * 1024)} MB or smaller.");

        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();

        // Both are checked because either alone is weak: a content type is whatever
        // the client claims, and an extension is whatever the file was named.
        if (!AllowedExtensions.Contains(extension) ||
            !AllowedContentTypes.Contains(contentType.ToLowerInvariant()))
            return Result<string>.Fail("Only JPG, PNG and WEBP images are accepted.");

        // The stored name is generated, never taken from the caller. An uploaded
        // name can contain "../" to escape the folder, and two people uploading
        // "photo.jpg" would otherwise overwrite each other.
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var folder = HouseFolder(houseId);

        Directory.CreateDirectory(folder);

        try
        {
            await using var file = File.Create(Path.Combine(folder, storedName));
            await content.CopyToAsync(file);
        }
        catch (IOException)
        {
            return Result<string>.Fail("The image could not be saved. Please try again.");
        }

        return Result<string>.Ok($"{_publicRoot}/{houseId}/{storedName}");
    }

    public void DeleteHouseFolder(int houseId)
    {
        var folder = HouseFolder(houseId);

        if (Directory.Exists(folder))
            Directory.Delete(folder, recursive: true);
    }

    // houseId is an int from the route, so it cannot carry a path separator.
    private string HouseFolder(int houseId) =>
        Path.Combine(_rootOnDisk, houseId.ToString());
}
