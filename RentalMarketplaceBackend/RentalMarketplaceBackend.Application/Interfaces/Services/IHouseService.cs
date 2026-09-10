using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Houses;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

public interface IHouseService
{
    Task<IReadOnlyList<HouseDto>> SearchAsync(HouseSearchDto filter);
    Task<HouseDto?> GetByIdAsync(int id, string? requesterId = null, bool isAdmin = false);

    Task<IReadOnlyList<HouseDto>> GetMineAsync(string ownerId);
    Task<Result<HouseDto>> CreateAsync(HouseCreateDto dto, string ownerId, bool isAdmin = false);

    /// <summary>
    /// FR-2.7 / FR-2.10. No isAdmin parameter on purpose: FR-9.3.4 says an
    /// administrator shall not edit the content of another user's listing, so
    /// there is no privileged path to give them. Admins moderate, they do not
    /// rewrite.
    /// </summary>
    Task<Result<HouseDto>> UpdateAsync(int id, HouseUpdateDto dto, string requesterId);

    /// <summary>
    /// FR-2.8 — delist without deleting. Separate from UpdateAsync because it is
    /// a different act: taking a property off the market is one click and must
    /// not require resubmitting, or re-passing, the whole listing.
    /// </summary>
    Task<Result<HouseDto>> SetAvailabilityAsync(int id, bool isAvailable, string requesterId);

    Task<Result<string>> AddImageAsync(
        int houseId, string requesterId,
        Stream content, string fileName, string contentType, long lengthInBytes);

    Task<IReadOnlyList<HouseDto>> GetPendingAsync();
    Task<Result<HouseDto>> ApproveAsync(int id);
    Task<Result<HouseDto>> RejectAsync(int id);
}