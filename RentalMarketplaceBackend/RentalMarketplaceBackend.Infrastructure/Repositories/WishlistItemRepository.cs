using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Infrastructure.Persistence;

namespace RentalMarketplaceBackend.Infrastructure.Repositories;

public class WishlistItemRepository : GenericRepository<WishlistItem>, IWishlistRepository
{
    public WishlistItemRepository(AppDbContext context) : base(context) { }
}
