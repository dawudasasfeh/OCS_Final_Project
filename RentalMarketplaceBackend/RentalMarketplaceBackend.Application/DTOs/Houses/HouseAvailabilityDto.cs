namespace RentalMarketplaceBackend.Application.DTOs.Houses;

/// <summary>
/// The body of PATCH /houses/{id}/availability.
///
/// A named property rather than a bare bool: a bare `true` in a request body
/// says nothing about what is being set, and a named field leaves room to carry
/// a reason for delisting later without changing the shape of the endpoint.
/// </summary>
public class HouseAvailabilityDto
{
    public bool IsAvailable { get; set; }
}
