using System;
using System.Collections.Generic;
using System.Text;

namespace RentalMarketplaceBackend.Application.DTOs.Auth
{
    public class AuthResponseDto
    {
        public string Token { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
