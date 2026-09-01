using RentalMarketplaceBackend.Application.DTOs.Auth;

namespace RentalMarketplaceBackend.Application.Interfaces.Services;

    public record AuthResult(bool Succeeded, string? Error, AuthResponseDto? Data);
    public interface IAuthService
    {
    Task<AuthResult> RegisterAsync(RegisterDto dto);
    Task<AuthResult> LoginAsync(LoginDto dto);
    }
