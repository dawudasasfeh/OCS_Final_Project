using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalMarketplaceBackend.Application.DTOs.Houses;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using System.Security.Claims;

namespace RentalMarketplaceBackend.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class HousesController : ControllerBase
{
    private readonly IHouseService _houseService;

    public HousesController(IHouseService houseService)
    {
        _houseService = houseService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Search([FromQuery] HouseSearchDto filter)
        => Ok(await _houseService.SearchAsync(filter));

    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> Mine()
        => Ok(await _houseService.GetMineAsync(CurrentUserId!));

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Pending()
        => Ok(await _houseService.GetPendingAsync());

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var house = await _houseService.GetByIdAsync(id, CurrentUserId, User.IsInRole("Admin"));
        return house is null ? NotFound() : Ok(house);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(HouseCreateDto dto)
    {
        var result = await _houseService.CreateAsync(dto, CurrentUserId!);

        return result.Succeeded
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data)
            : BadRequest(result.Error);
    }

    [HttpPatch("{id:int}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Approve(int id)
    {
        var result = await _houseService.ApproveAsync(id);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }

    [HttpPatch("{id:int}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reject(int id)
    {
        var result = await _houseService.RejectAsync(id);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }
}
