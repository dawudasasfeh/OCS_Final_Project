using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RentalMarketplaceBackend.Domain.Entities;
using RentalMarketplaceBackend.Domain.Enums;

namespace RentalMarketplaceBackend.Infrastructure.Persistence;

public static class DbSeeder
{
    private const string DemoPassword = "Test123!";
    private const string AdminPassword = "Admin123!";

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var db = services.GetRequiredService<AppDbContext>();
        var config = services.GetRequiredService<IConfiguration>();
        var env = services.GetRequiredService<IHostEnvironment>();

        foreach (var role in new[] { "Admin", "User" })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // Off unless asked for. Wiping a database on startup is not something
        // that should be one misconfigured environment away from happening.
        if (!config.GetValue<bool>("Seed:Reset"))
            return;

        var path = Path.Combine(env.ContentRootPath, "seed-data.json");
        if (!File.Exists(path))
            return;

        var json = await File.ReadAllTextAsync(path);
        var data = JsonSerializer.Deserialize<SeedData>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        });

        if (data is null) return;

        await ResetAsync(db, userManager);
        await LoadAsync(data, db, userManager);
    }

    /// <summary>
    /// Children before parents, so no foreign key is ever left dangling.
    /// Identity is reseeded so a re-run produces the same ids, which keeps the
    /// .http suite's hardcoded ids meaningful.
    /// </summary>
    private static async Task ResetAsync(AppDbContext db, UserManager<ApplicationUser> userManager)
    {
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Payments");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM WishlistItems");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Bookings");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Testimonials");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM HouseImages");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Houses");

        foreach (var table in new[] { "Payments", "WishlistItems", "Bookings", "Testimonials", "HouseImages", "Houses" })
            await db.Database.ExecuteSqlRawAsync($"DBCC CHECKIDENT ('{table}', RESEED, 0)");

        // Identity users go through UserManager so its own tables (roles,
        // claims, logins) are cleaned up with them.
        foreach (var user in await userManager.Users.ToListAsync())
            await userManager.DeleteAsync(user);
    }

    private static async Task LoadAsync(SeedData data, AppDbContext db, UserManager<ApplicationUser> userManager)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // ── users ────────────────────────────────────────────────────
        var users = new Dictionary<string, ApplicationUser>();

        foreach (var u in data.Users)
        {
            var user = new ApplicationUser
            {
                FullName = u.FullName,
                Email = u.Email,
                UserName = u.Email,
                PhoneNumber = u.PhoneNumber,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow.AddMonths(-6),
            };

            if (u.SubscriptionMonths is { } months)
            {
                user.IsSubscribed = true;
                user.SubscriptionExpiresAt = today.AddMonths(months);
            }

            var result = await userManager.CreateAsync(
                user, u.Role == "Admin" ? AdminPassword : DemoPassword);

            if (!result.Succeeded)
                throw new InvalidOperationException(
                    $"Seed user {u.Email}: {string.Join("; ", result.Errors.Select(e => e.Description))}");

            await userManager.AddToRoleAsync(user, u.Role);
            users[u.Key] = user;
        }

        // ── houses ───────────────────────────────────────────────────
        var houses = new Dictionary<string, House>();

        foreach (var h in data.Houses)
        {
            var house = new House
            {
                Title = h.Title,
                Description = h.Description,
                PropertyType = (PropertyType)h.PropertyType,
                Address = h.Address,
                City = h.City,
                Neighborhood = h.Neighborhood,
                Price = h.Price,
                PriceUnit = (DurationType)h.PriceUnit,
                Bedrooms = h.Bedrooms,
                Bathrooms = h.Bathrooms,
                AreaSqM = h.AreaSqM,
                IsFurnished = h.IsFurnished,
                FloorNumber = h.FloorNumber,
                MasterBedrooms = h.MasterBedrooms,
                ApartmentsInBuilding = h.ApartmentsInBuilding,
                BuildingAge = h.BuildingAge is { } age ? (BuildingAge)age : null,
                TurnoverDays = h.TurnoverDays,
                OwnerId = users[h.OwnerKey].Id,
                Status = Enum.Parse<ListingStatus>(h.Status),
                IsAvailable = h.IsAvailable,
                CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(3, 90)),
            };

            db.Houses.Add(house);
            houses[h.Key] = house;
        }

        await db.SaveChangesAsync();

        // ── bookings ─────────────────────────────────────────────────
        var bookings = new Dictionary<string, Booking>();

        foreach (var b in data.Bookings)
        {
            var house = houses[b.HouseKey];
            var start = DateOnly.Parse(b.StartDate);
            var unit = (DurationType)b.DurationType;

            var booking = new Booking
            {
                HouseId = house.Id,
                RenterId = users[b.RenterKey].Id,
                StartDate = start,
                EndDate = EndDateFor(start, unit, b.DurationCount),
                DurationType = unit,
                DurationCount = b.DurationCount,
                // Snapshotted the same way BookingService does it.
                TotalPrice = house.Price * b.DurationCount,
                Status = Enum.Parse<BookingStatus>(b.Status),
                CreatedAt = start.ToDateTime(TimeOnly.MinValue).AddDays(-Random.Shared.Next(2, 21)),
            };

            db.Bookings.Add(booking);
            bookings[b.Key] = booking;
        }

        await db.SaveChangesAsync();

        // ── payments ─────────────────────────────────────────────────
        foreach (var p in data.Payments)
        {
            var status = Enum.Parse<PaymentStatus>(p.Status);

            db.Payments.Add(new Payment
            {
                Amount = p.Amount,
                Purpose = Enum.Parse<PaymentPurpose>(p.Purpose),
                Method = (PaymentMethod)p.Method,
                Status = status,
                ReferenceNote = p.ReferenceNote,
                PayerId = users[p.PayerKey].Id,
                BookingId = p.BookingKey is { } bk ? bookings[bk].Id : null,
                CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 60)),
                // Only a confirmed payment carries a timestamp, for the same
                // reason Testimonial.ApprovedAt is cleared on rejection.
                ConfirmedAt = status == PaymentStatus.Confirmed
                    ? DateTime.UtcNow.AddDays(-Random.Shared.Next(0, 30))
                    : null,
            });
        }

        // ── testimonials ─────────────────────────────────────────────
        foreach (var t in data.Testimonials)
        {
            var status = Enum.Parse<TestimonialStatus>(t.Status);

            db.Testimonials.Add(new Testimonial
            {
                Content = t.Content,
                UserId = users[t.UserKey].Id,
                Status = status,
                CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(2, 120)),
                ApprovedAt = status == TestimonialStatus.Approved
                    ? DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 60))
                    : null,
            });
        }

        // ── wishlist ─────────────────────────────────────────────────
        foreach (var w in data.Wishlist)
        {
            db.WishlistItems.Add(new WishlistItem
            {
                UserId = users[w.UserKey].Id,
                HouseId = houses[w.HouseKey].Id,
                CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 45)),
            });
        }

        await db.SaveChangesAsync();
    }

    /// <summary>Mirrors the switch in BookingService.CreateAsync.</summary>
    private static DateOnly EndDateFor(DateOnly start, DurationType unit, int count) => unit switch
    {
        DurationType.Weekly => start.AddDays(count * 7),
        DurationType.Monthly => start.AddMonths(count),
        DurationType.Yearly => start.AddYears(count),
        _ => throw new ArgumentOutOfRangeException(nameof(unit)),
    };
}
