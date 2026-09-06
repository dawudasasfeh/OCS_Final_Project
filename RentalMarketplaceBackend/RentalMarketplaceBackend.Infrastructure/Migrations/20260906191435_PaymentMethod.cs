using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalMarketplaceBackend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PaymentMethod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // EF scaffolds defaultValue 0, which is not a member of
            // PaymentMethod. 1 is Cash, so a row inserted outside the
            // application still lands on a method the code can name.
            migrationBuilder.AddColumn<int>(
                name: "Method",
                table: "Payments",
                type: "int",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Method",
                table: "Payments");
        }
    }
}
