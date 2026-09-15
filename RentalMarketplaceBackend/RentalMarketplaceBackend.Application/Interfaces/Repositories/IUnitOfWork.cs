namespace RentalMarketplaceBackend.Application.Interfaces.Repositories;

public interface IUnitOfWork
{
    IHouseRepository Houses { get; }
    IBookingRepository Bookings { get; }
    IPaymentRepository Payments { get; }
    ITestimonialRepository Testimonials { get; }
    IWishlistRepository Wishlist { get; }

    Task<int> SaveChangesAsync();

    /// <summary>
    /// Runs <paramref name="work"/> as one serializable transaction, retried
    /// from the start if the database reports a transient failure. For
    /// check-then-write sequences that must not interleave with a concurrent
    /// copy of themselves, such as "no overlapping booking, so insert one".
    /// </summary>
    Task<T> InTransactionAsync<T>(Func<Task<T>> work);
}
