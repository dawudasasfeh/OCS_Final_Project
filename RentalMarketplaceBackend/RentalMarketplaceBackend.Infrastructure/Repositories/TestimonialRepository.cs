using Microsoft.EntityFrameworkCore;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;
using RentalMarketplaceBackend.Infrastructure.Persistence;

namespace RentalMarketplaceBackend.Infrastructure.Repositories;

public class TestimonialRepository : GenericRepository<Testimonial>, ITestimonialRepository
{
    public TestimonialRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Testimonial>> GetApprovedAsync() =>
        await _dbSet.AsNoTracking()
                    .Include(t => t.User)
                    .Where(t => t.Status == TestimonialStatus.Approved)
                    .OrderByDescending(t => t.CreatedAt)
                    .ToListAsync();

    public async Task<Testimonial?> GetWithUserAsync(int id) =>
    await _dbSet.Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<IReadOnlyList<Testimonial>> GetPendingAsync() =>
    await _dbSet.AsNoTracking()
                .Include(t => t.User)
                .Where(t => t.Status == TestimonialStatus.Pending)
                .OrderBy(t => t.CreatedAt)
                .ToListAsync();
}
