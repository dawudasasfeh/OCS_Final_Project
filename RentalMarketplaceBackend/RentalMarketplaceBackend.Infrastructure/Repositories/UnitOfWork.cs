using System.Data;
using Microsoft.EntityFrameworkCore;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Infrastructure.Persistence;


namespace RentalMarketplaceBackend.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(AppDbContext context) { 
        _context = context;
        Houses = new HouseRepository(context);
        Bookings = new BookingRepository(context);
        Payments = new PaymentRepository (context);
        Testimonials = new TestimonialRepository(context);
        Wishlist = new WishlistItemRepository(context);
    }

    public IHouseRepository Houses { get; }
    public IBookingRepository Bookings { get; }
    public IPaymentRepository Payments { get; }
    public ITestimonialRepository Testimonials { get; }
    public IWishlistRepository Wishlist { get; }

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

    // Serializable makes SQL Server hold range locks on everything the work
    // read. Two requests checking the same house's dates at once then collide
    // on insert; one becomes the deadlock victim, the execution strategy runs
    // it again from the top, and the rerun sees the other's committed row.
    public Task<T> InTransactionAsync<T>(Func<Task<T>> work) =>
        _context.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            // A rerun must not re-insert what the failed attempt had staged.
            _context.ChangeTracker.Clear();

            await using var tx = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            var result = await work();
            await tx.CommitAsync();
            return result;
        });
}
