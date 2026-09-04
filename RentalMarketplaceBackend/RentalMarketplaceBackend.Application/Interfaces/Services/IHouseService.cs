using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Houses;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

public interface IHouseService
{
    Task<IReadOnlyList<HouseDto>> SearchAsync(HouseSearchDto filter);
    Task<HouseDto?> GetByIdAsync(int id, string? requesterId = null, bool isAdmin = false);

    Task<IReadOnlyList<HouseDto>> GetMineAsync(string ownerId);
    Task<Result<HouseDto>> CreateAsync(HouseCreateDto dto, string ownerId);

    Task<IReadOnlyList<HouseDto>> GetPendingAsync();
    Task<Result<HouseDto>> ApproveAsync(int id);
    Task<Result<HouseDto>> RejectAsync(int id);
}