using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Infrastructure.Persistence;


namespace RentalMarketplaceBackend.Infrastructure.Repositories;

public class TestimonialRepository : GenericRepository<Testimonial>, ITestimonialRepository
{
    public TestimonialRepository(AppDbContext context) : base(context) { }
}
