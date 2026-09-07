using Microsoft.AspNetCore.Identity;
using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Testimonials;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Reflection.Metadata;
using System.Text;

namespace RentalMarketplaceBackend.Application.Services;

public class TestimonialService : ITestimonialService
{
    private readonly IUnitOfWork _uow;
    private readonly UserManager<ApplicationUser> _userManager;

    public TestimonialService(
        IUnitOfWork uow,
        UserManager<ApplicationUser> userManager)
    {
        _uow = uow;
        _userManager = userManager;
    }

    public async Task<IReadOnlyList<TestimonialDto>> GetApprovedAsync() {
        var testimonials = await _uow.Testimonials.GetApprovedAsync();
        return testimonials.Select(t => Map(t)).ToList();
    }
    public async Task<Result<TestimonialDto>> CreateAsync(TestimonialCreateDto dto, string userId) {

        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
            return Result<TestimonialDto>.Fail("Account not found.");

        var testimonial = new Testimonial
        {
            Content = dto.Content.Trim(),
            Status = TestimonialStatus.Pending,
            ApprovedAt = null,
            CreatedAt = DateTime.UtcNow,
            UserId = userId
        };

        await _uow.Testimonials.AddAsync(testimonial);
        await _uow.SaveChangesAsync();

        testimonial.User = user;

        return Result<TestimonialDto>.Ok(Map(testimonial));
    }

    public async Task<IReadOnlyList<TestimonialDto>> GetPendingAsync() {
        var testimonials = await _uow.Testimonials.GetPendingAsync();
        return testimonials.Select(t => Map(t)).ToList();
    }
    public Task<Result<TestimonialDto>> ApproveAsync(int id) =>
        ReviewAsync(id, TestimonialStatus.Approved);

    public Task<Result<TestimonialDto>> RejectAsync(int id) =>
        ReviewAsync(id, TestimonialStatus.Rejected);

    private async Task<Result<TestimonialDto>> ReviewAsync(int id, TestimonialStatus status)
    {
        var testimonial = await _uow.Testimonials.GetWithUserAsync(id);

        if (testimonial is null)
            return Result<TestimonialDto>.Fail("Testimonial not found.");

        if (testimonial.Status == status)
            return Result<TestimonialDto>.Fail(
                $"This testimonial is already {status.ToString().ToLower()}.");

        testimonial.Status = status;

        testimonial.ApprovedAt = status == TestimonialStatus.Approved
            ? DateTime.UtcNow
            : null;

        await _uow.SaveChangesAsync();

        return Result<TestimonialDto>.Ok(Map(testimonial));
    }
    private TestimonialDto Map(Testimonial t) => new()
    { 
        Id = t.Id,
        Content = t.Content,
        Status = t.Status.ToString(),
        CreatedAt = t.CreatedAt,
        UserName = t.User?.FullName ?? string.Empty,
    };

}
