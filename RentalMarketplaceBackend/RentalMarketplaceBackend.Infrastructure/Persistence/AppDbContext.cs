using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RentalMarketplaceBackend.Domain.Entities;

namespace RentalMarketplaceBackend.Infrastructure.Persistence
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<House> Houses { get; set; }
        public DbSet<HouseImage> HouseImages { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Testimonial> Testimonials { get; set; }
        public DbSet<WishlistItem> WishlistItems { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<WishlistItem>()
                .HasIndex(w => new { w.UserId, w.HouseId })
                .IsUnique();

            builder.Entity<Booking>()
                .HasIndex(b => new { b.HouseId, b.StartDate, b.EndDate });

            builder.Entity<House>()
                .HasIndex(h => h.City);

            builder.Entity<Booking>()
                .HasOne(b => b.Renter)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.RenterId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Payment>()
                .HasOne(p => p.Payer)
                .WithMany()
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<WishlistItem>()
                .HasOne(w => w.User)
                .WithMany()
                .OnDelete(DeleteBehavior.Restrict);
        }

    }
}
