using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalMarketplaceBackend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHouseDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Address",
                table: "Houses",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<int>(
                name: "ApartmentsInBuilding",
                table: "Houses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BuildingAge",
                table: "Houses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FloorNumber",
                table: "Houses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFurnished",
                table: "Houses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "MasterBedrooms",
                table: "Houses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Neighborhood",
                table: "Houses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApartmentsInBuilding",
                table: "Houses");

            migrationBuilder.DropColumn(
                name: "BuildingAge",
                table: "Houses");

            migrationBuilder.DropColumn(
                name: "FloorNumber",
                table: "Houses");

            migrationBuilder.DropColumn(
                name: "IsFurnished",
                table: "Houses");

            migrationBuilder.DropColumn(
                name: "MasterBedrooms",
                table: "Houses");

            migrationBuilder.DropColumn(
                name: "Neighborhood",
                table: "Houses");

            migrationBuilder.AlterColumn<string>(
                name: "Address",
                table: "Houses",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(250)",
                oldMaxLength: 250);
        }
    }
}
