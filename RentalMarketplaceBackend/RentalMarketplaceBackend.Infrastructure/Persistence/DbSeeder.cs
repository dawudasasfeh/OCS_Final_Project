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
    // The demo accounts' password is meant to be shared — they exist so a
    // visitor can try the site. The administrator's is not: it moderates
    // everything, so outside Development it must come from Seed:AdminPassword.
    private const string DefaultDemoPassword = "Test123!";
    private const string DevAdminPassword = "Admin123!";

    /// <summary>Kept in step with FileStorageService.AllowedExtensions.</summary>
    private static readonly string[] ImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

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

        var adminPassword = config["Seed:AdminPassword"];

        if (string.IsNullOrWhiteSpace(adminPassword))
        {
            // Refused before anything is deleted, so a misconfigured reseed
            // leaves the existing data intact.
            if (!env.IsDevelopment())
                throw new InvalidOperationException(
                    "Seed:Reset is on but Seed:AdminPassword is not set. Set the Seed__AdminPassword environment variable.");

            adminPassword = DevAdminPassword;
        }

        var passwords = new SeedPasswords(
            adminPassword,
            config["Seed:DemoPassword"] is { Length: > 0 } demo ? demo : DefaultDemoPassword);

        await ResetAsync(db, userManager);
        await LoadAsync(data, db, userManager, ImageStore.For(env, config), passwords);
    }

    private sealed record SeedPasswords(string Admin, string Demo);

    /// <summary>
    /// Where listing photographs already sit on disk, and the URL prefix they
    /// are served under. Both are derived the same way FileStorageService
    /// derives them, so a seeded image and an uploaded one are indistinguishable.
    /// </summary>
    private sealed record ImageStore(string RootOnDisk, string PublicRoot)
    {
        public static ImageStore For(IHostEnvironment env, IConfiguration config)
        {
            var folder = (config["FileStorage:HouseImagesFolder"] ?? "uploads/houses").Trim('/');

            return new ImageStore(
                Path.Combine(env.ContentRootPath, "wwwroot",
                    folder.Replace('/', Path.DirectorySeparatorChar)),
                "/" + folder);
        }
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

        // RESEED to 0 is only correct on a table that has already held a row:
        // there the next insert takes 0 + increment = 1. On a table that has
        // never been inserted into — a database freshly migrated on a new
        // machine — the next insert takes the reseed value itself, so ids start
        // at 0 and every house lands one short of its image folder. A never-used
        // identity already starts at 1, so it is left alone.
        foreach (var table in new[] { "Payments", "WishlistItems", "Bookings", "Testimonials", "HouseImages", "Houses" })
            await db.Database.ExecuteSqlRawAsync(
                $"""
                 IF EXISTS (SELECT 1 FROM sys.identity_columns
                            WHERE object_id = OBJECT_ID('{table}') AND last_value IS NOT NULL)
                     DBCC CHECKIDENT ('{table}', RESEED, 0)
                 """);

        // Identity users go through UserManager so its own tables (roles,
        // claims, logins) are cleaned up with them.
        foreach (var user in await userManager.Users.ToListAsync())
            await userManager.DeleteAsync(user);
    }

    private static async Task LoadAsync(
        SeedData data, AppDbContext db, UserManager<ApplicationUser> userManager, ImageStore images,
        SeedPasswords passwords)
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
                user, u.Role == "Admin" ? passwords.Admin : passwords.Demo);

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

        // ── house images ─────────────────────────────────────────────
        // The photographs are already on disk from earlier uploads, one folder
        // per house id. Identity was reseeded above, so the Nth house in
        // seed-data.json takes id N and finds the folder its own photos are in.
        // Nothing is copied or renamed; this only records what is already there.
        foreach (var house in houses.Values)
        {
            var folder = Path.Combine(images.RootOnDisk, house.Id.ToString());

            if (!Directory.Exists(folder))
                continue;

            // A watermarked .webp is a real photograph of the property. The .jpg
            // files mixed into the older folders are generic stock, so they sort
            // last and never become the cover image.
            var files = Directory.EnumerateFiles(folder)
                .Where(f => ImageExtensions.Contains(Path.GetExtension(f).ToLowerInvariant()))
                .OrderBy(f => Path.GetExtension(f).Equals(".webp", StringComparison.OrdinalIgnoreCase) ? 0 : 1)
                .ThenBy(Path.GetFileName, StringComparer.Ordinal)
                .ToList();

            for (var i = 0; i < files.Count; i++)
            {
                db.HouseImages.Add(new HouseImage
                {
                    HouseId = house.Id,
                    ImageUrl = $"{images.PublicRoot}/{house.Id}/{Path.GetFileName(files[i])}",
                    IsPrimary = i == 0,
                });
            }
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
