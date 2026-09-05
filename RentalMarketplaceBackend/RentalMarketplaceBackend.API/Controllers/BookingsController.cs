using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalMarketplaceBackend.Application.DTOs.Bookings;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using System.Security.Claims;

namespace RentalMarketplaceBackend.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }


    [HttpPost]
    public async Task<IActionResult> Create(BookingCreateDto dto) {
        var result = await _bookingService.CreateAsync(dto, CurrentUserId!);
        return result.Succeeded ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data)
        : BadRequest(result.Error);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) {
        var booking = await _bookingService.GetByIdAsync(id, CurrentUserId!, User.IsInRole("Admin"));
        return booking is null ? NotFound() : Ok(booking);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> Mine() {
        var result = await _bookingService.GetMineAsync(CurrentUserId!);
        return Ok(result);
    }

    [HttpGet("requests")]
    public async Task<IActionResult> Requests() {
        var result = await _bookingService.GetRequestsAsync(CurrentUserId!);
        return Ok(result);
    }

    [HttpPatch("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id) {
        var result = await _bookingService.ConfirmAsync(id,CurrentUserId!);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }

    [HttpPatch("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id) {
        var result = await _bookingService.RejectAsync(id, CurrentUserId!);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }

    [HttpPatch("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id) {
        var result = await _bookingService.CancelAsync(id, CurrentUserId!);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }


}
