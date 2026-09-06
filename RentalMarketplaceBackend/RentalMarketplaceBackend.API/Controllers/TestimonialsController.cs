using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalMarketplaceBackend.Application.DTOs.Testimonials;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using System.Security.Claims;

namespace RentalMarketplaceBackend.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TestimonialsController : ControllerBase
{
    private readonly ITestimonialService _testimonialService;

    public TestimonialsController(ITestimonialService testimonialService)
    {
        _testimonialService = testimonialService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    /// <summary>Approved testimonials, for the home page. Public.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetApproved()
        => Ok(await _testimonialService.GetApprovedAsync());

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(TestimonialCreateDto dto)
    {
        var result = await _testimonialService.CreateAsync(dto, CurrentUserId!);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Pending()
        => Ok(await _testimonialService.GetPendingAsync());

    [HttpPatch("{id:int}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Approve(int id)
    {
        var result = await _testimonialService.ApproveAsync(id);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }

    [HttpPatch("{id:int}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reject(int id)
    {
        var result = await _testimonialService.RejectAsync(id);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }
}
