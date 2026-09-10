using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using System.Security.Claims;

namespace RentalMarketplaceBackend.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SubscriptionController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var result = await _subscriptionService.GetForUserAsync(CurrentUserId!);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// FR-9.1.1 — every account with its subscription state. Admin only: it is
    /// a directory of who has registered, which is nobody else's business.
    /// </summary>
    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Users()
        => Ok(await _subscriptionService.GetAllForAdminAsync());

    [HttpPatch("{userId}/grant")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Grant(string userId)
    {
        var result = await _subscriptionService.GrantAsync(userId);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }

    [HttpPatch("{userId}/revoke")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Revoke(string userId)
    {
        var result = await _subscriptionService.RevokeAsync(userId);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }
}