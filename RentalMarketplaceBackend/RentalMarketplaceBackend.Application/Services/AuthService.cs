using Microsoft.AspNetCore.Identity;
using RentalMarketplaceBackend.Application.DTOs.Auth;
using RentalMarketplaceBackend.Application.Interfaces.Services;
using RentalMarketplaceBackend.Domain.Entities;

namespace RentalMarketplaceBackend.Application.Services
{
    public class AuthService : IAuthService 
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;

        public AuthService(UserManager<ApplicationUser> userManager, ITokenService tokenService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
        }

        public async Task<AuthResult> RegisterAsync(RegisterDto dto) { 
            if (await _userManager.FindByEmailAsync(dto.Email) is not null)
                return new AuthResult(false, "Email is already registered.", null);

            var user = new ApplicationUser
            {
                FullName = dto.FullName,
                Email = dto.Email,
                UserName = dto.Email,
                PhoneNumber = dto.PhoneNumber,
            };

            var result = await _userManager.CreateAsync(user,dto.Password);

            if(!result.Succeeded)
                return new AuthResult(false, string.Join(" ", result.Errors.Select(e => e.Description)), null);

            await _userManager.AddToRoleAsync(user, "User");

            return new AuthResult(true, null, Build(user, "User"));

        }
        public async Task<AuthResult> LoginAsync(LoginDto dto) { 
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return new AuthResult(false, "Invalid Email or Password.", null);

            // Checked before the password, so a locked account stays locked even
            // when the next guess happens to be right.
            if (await _userManager.IsLockedOutAsync(user))
                return new AuthResult(false, "Too many failed sign-in attempts. Try again in 15 minutes.", null);

            if (!await _userManager.CheckPasswordAsync(user, dto.Password))
            {
                await _userManager.AccessFailedAsync(user);
                return new AuthResult(false, "Invalid Email or Password.", null);
            }

            await _userManager.ResetAccessFailedCountAsync(user);

            var role = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "User";

            return new AuthResult(true, null, Build(user,role));
            
        }

        private AuthResponseDto Build(ApplicationUser user, string role) {
            var (token, expiresAt) = _tokenService.CreateToken(user, role);
            return new AuthResponseDto { Token = token,ExpiresAt = expiresAt };
        }
    }
}
