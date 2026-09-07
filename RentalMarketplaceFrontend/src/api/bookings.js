import client from "./client";

export function createBooking(dto) {
    return client.post("/bookings", dto).then((r) => r.data);
}

export function getBooking(id) {
    return client.get(`/bookings/${id}`).then((r) => r.data);
}

export function getMyBookings() {
    return client.get("/bookings/mine").then((r) => r.data);
}

export function getBookingRequests() {
    return client.get("/bookings/requests").then((r) => r.data);
}

export function confirmBooking(id) {
    return client.patch(`/bookings/${id}/confirm`).then((r) => r.data);
}

export function rejectBooking(id) {
    return client.patch(`/bookings/${id}/reject`).then((r) => r.data);
}

export function cancelBooking(id) {
    return client.patch(`/bookings/${id}/cancel`).then((r) => r.data);
}

// The URL hangs off a house, but the data is bookings — which is why this lives
// here and not in houses.js. Public: works for a guest too.
export function getAvailability(houseId) {
    return client.get(`/houses/${houseId}/availability`).then((r) => r.data);
}
