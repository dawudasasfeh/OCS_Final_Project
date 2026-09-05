using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalMarketplaceBackend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingDurationCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DurationCount",
                table: "Bookings",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DurationCount",
                table: "Bookings");
        }
    }
}
