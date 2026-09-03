using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalMarketplaceBackend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTurnoverDays : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TurnoverDays",
                table: "Houses",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TurnoverDays",
                table: "Houses");
        }
    }
}
