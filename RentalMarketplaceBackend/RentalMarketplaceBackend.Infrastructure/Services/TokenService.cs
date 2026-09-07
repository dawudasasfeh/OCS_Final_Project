using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Domain.Entities;

namespace RentalMarketplaceBackend.Infrastructure.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;

        public TokenService(IConfiguration config) => _config = config;

        public (string Token, DateTime ExpiresAt) CreateToken(ApplicationUser user, string role) {
            // Subscription state is deliberately NOT a claim. A token is stamped
            // at sign-in and lives for its whole lifetime, so an "isSubscribed"
            // claim goes stale the moment an admin confirms a payment — the user
            // has paid, the database agrees, and the token still says no until
            // they sign out and back in. Callers read GET /subscription/me,
            // which is always current.
            var claims = new List<Claim> {
                new(JwtRegisteredClaimNames.Sub , user.Id),
                new(JwtRegisteredClaimNames.Name, user.FullName),
                new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new(ClaimTypes.Role, role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expires = DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:ExpiryMinutes"]!));

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: credentials
                );


            return (new JwtSecurityTokenHandler().WriteToken(token), expires);
        }
    }
}
