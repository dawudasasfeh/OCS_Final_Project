using RentalMarketplaceBackend.Application.Common;
using RentalMarketplaceBackend.Application.DTOs.Testimonials;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

public interface ITestimonialService
{
    Task<IReadOnlyList<TestimonialDto>> GetApprovedAsync();

    Task<Result<TestimonialDto>> CreateAsync(TestimonialCreateDto dto, string userId);

    Task<IReadOnlyList<TestimonialDto>> GetPendingAsync();
    Task<Result<TestimonialDto>> ApproveAsync(int id);
    Task<Result<TestimonialDto>> RejectAsync(int id);
}
