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
}
