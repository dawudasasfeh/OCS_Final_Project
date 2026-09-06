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