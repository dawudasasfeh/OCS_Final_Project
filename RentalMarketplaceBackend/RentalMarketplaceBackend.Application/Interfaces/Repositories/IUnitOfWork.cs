namespace RentalMarketplaceBackend.Application.Interfaces.Repositories
{
    public interface IUnitOfWork
    {
        IHouseRepository Houses { get; }
        IBookingRepository Bookings { get; }
        IPaymentRepository Payments { get; }
        ITestimonialRepository Testimonials { get; }
        IWishlistRepository Wishlist { get; }

        Task<int> SaveChangesAsync();
    }
}
