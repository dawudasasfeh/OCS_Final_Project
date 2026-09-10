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
    private readonly IBookingService _bookingService;

    public HousesController(IHouseService houseService, IBookingService bookingService)
    {
        _houseService = houseService;
        _bookingService = bookingService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    /// <summary>
    /// FR-1.4 — browse and filter approved listings, one page at a time.
    ///
    /// The response is a page object rather than a bare array. It has to be:
    /// twelve listings tell a client nothing about whether there are thirty
    /// more behind them, and a pager cannot be drawn without the total.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Search([FromQuery] HouseSearchDto filter)
        => Ok(await _houseService.SearchAsync(filter));

    /// <summary>
    /// Listing counts per city. Its own endpoint because the search is paged
    /// now: the suggestions used to be counted from a full download of every
    /// listing, which page one no longer contains.
    /// </summary>
    [HttpGet("city-counts")]
    [AllowAnonymous]
    public async Task<IActionResult> CityCounts()
        => Ok(await _houseService.GetCityCountsAsync());

    [HttpGet("{id:int}/availability")]
    [AllowAnonymous]
    public async Task<IActionResult> Availability(int id)
    {
        var result = await _bookingService.GetAvailabilityAsync(id);
        return result.Succeeded ? Ok(result.Data) : NotFound(result.Error);
    }

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
        var result = await _houseService.CreateAsync(dto, CurrentUserId!, User.IsInRole("Admin"));

        return result.Succeeded
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data)
            : BadRequest(result.Error);
    }
    /// <summary>
    /// FR-2.7 — an owner edits their own listing.
    ///
    /// The id comes from the route and the owner from the token; the body carries
    /// neither, so a caller cannot reach someone else's listing by changing what
    /// they post. A refusal is 400 rather than 403 because the service returns one
    /// shape for "not found" and "not yours", and separating them would tell a
    /// stranger which listing ids exist.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, HouseUpdateDto dto)
    {
        var result = await _houseService.UpdateAsync(id, dto, CurrentUserId!);

        return result.Succeeded
            ? Ok(result.Data)
            : BadRequest(result.Error);
    }

    /// <summary>
    /// FR-2.8 — delist or relist. PATCH rather than PUT: this flips one flag, and
    /// an owner taking a property off the market should not have to resend the
    /// whole listing, or re-pass its validation, to do it.
    /// </summary>
    [HttpPatch("{id:int}/availability")]
    [Authorize]
    public async Task<IActionResult> SetAvailability(int id, [FromBody] HouseAvailabilityDto dto)
    {
        var result = await _houseService.SetAvailabilityAsync(id, dto.IsAvailable, CurrentUserId!);

        return result.Succeeded
            ? Ok(result.Data)
            : BadRequest(result.Error);
    }

    /// <summary>
    /// Adds one photo to a listing the caller owns. Images are uploaded after the
    /// listing exists so each one has a house folder to live in, and so a form
    /// that is abandoned leaves nothing behind on disk.
    /// </summary>
    [HttpPost("{id:int}/images")]
    [Authorize]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> AddImage(int id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file was uploaded.");

        await using var stream = file.OpenReadStream();

        var result = await _houseService.AddImageAsync(
            id, CurrentUserId!, stream, file.FileName, file.ContentType, file.Length);

        return result.Succeeded
            ? Ok(new { url = result.Data })
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
