using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalMarketplaceBackend.Application.DTOs.Payments;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using System.Security.Claims;

namespace RentalMarketplaceBackend.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpPost("booking")]
    public async Task<IActionResult> CreateBookingPayment(BookingPaymentCreateDto dto)
    {
        var result = await _paymentService.CreateBookingPaymentAsync(dto, CurrentUserId!);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }

    [HttpPost("subscription")]
    public async Task<IActionResult> CreateSubscriptionPayment(SubscriptionPaymentCreateDto dto)
    {
        var result = await _paymentService.CreateSubscriptionPaymentAsync(dto, CurrentUserId!);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> Mine()
        => Ok(await _paymentService.GetMineAsync(CurrentUserId!));

    [HttpGet("booking/{bookingId:int}")]
    public async Task<IActionResult> ForBooking(int bookingId)
    {
        var result = await _paymentService.GetForBookingAsync(bookingId, CurrentUserId!, User.IsInRole("Admin"));

        return result.Succeeded ? Ok(result.Data) : NotFound(result.Error);
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PendingSubscriptions()
        => Ok(await _paymentService.GetPendingSubscriptionsAsync());

    [HttpPatch("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id)
    {
        var result = await _paymentService.ConfirmAsync(id, CurrentUserId!, User.IsInRole("Admin"));

        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }

    [HttpPatch("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var result = await _paymentService.RejectAsync(id, CurrentUserId!, User.IsInRole("Admin"));

        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }
}