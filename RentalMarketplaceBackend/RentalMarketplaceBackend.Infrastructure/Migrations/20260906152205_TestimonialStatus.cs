using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalMarketplaceBackend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TestimonialStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "Testimonials");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ApprovedAt",
                table: "Testimonials",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            // EF scaffolds defaultValue 0, which is not a member of
            // TestimonialStatus. 1 is Pending, so a row inserted outside the
            // application still lands in a state the code understands.
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Testimonials",
                type: "int",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Testimonials");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ApprovedAt",
                table: "Testimonials",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "Testimonials",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
