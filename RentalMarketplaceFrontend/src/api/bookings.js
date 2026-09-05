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
