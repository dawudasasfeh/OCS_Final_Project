using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using System.Security.Claims;

namespace RentalMarketplaceBackend.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly IWishlistService _wishlistService;

    public WishlistController(IWishlistService wishlistService)
    {
        _wishlistService = wishlistService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<IActionResult> Mine()
        => Ok(await _wishlistService.GetMineAsync(CurrentUserId!));

    /// <summary>
    /// The house id is a route parameter rather than a body, so adding and
    /// removing address the same URL.
    /// </summary>
    [HttpPost("{houseId:int}")]
    public async Task<IActionResult> Add(int houseId)
    {
        var result = await _wishlistService.AddAsync(houseId, CurrentUserId!);
        return result.Succeeded ? NoContent() : BadRequest(result.Error);
    }

    [HttpDelete("{houseId:int}")]
    public async Task<IActionResult> Remove(int houseId)
    {
        var result = await _wishlistService.RemoveAsync(houseId, CurrentUserId!);
        return result.Succeeded ? NoContent() : BadRequest(result.Error);
    }
}
