using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Application.Interfaces.Repositories;

public interface ITestimonialRepository : IGenericRepository<Testimonial>
{
    Task<IReadOnlyList<Testimonial>> GetApprovedAsync();
    Task<Testimonial?> GetWithUserAsync(int id);
    Task<IReadOnlyList<Testimonial>> GetPendingAsync();


}