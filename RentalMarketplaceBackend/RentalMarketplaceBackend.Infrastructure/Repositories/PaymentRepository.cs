using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Infrastructure.Persistence;

namespace RentalMarketplaceBackend.Infrastructure.Repositories;

public class PaymentRepository : GenericRepository<Payment>, IPaymentRepository
{
    public PaymentRepository(AppDbContext context) : base(context) { }
}
