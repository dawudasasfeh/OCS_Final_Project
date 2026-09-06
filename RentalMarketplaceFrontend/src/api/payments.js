import client from "./client";

export function createBookingPayment(dto) {
    return client.post("/payments/booking", dto).then((r) => r.data);
}

export function createSubscriptionPayment(dto) {
    return client.post("/payments/subscription", dto).then((r) => r.data);
}

export function getMyPayments() {
    return client.get("/payments/mine").then((r) => r.data);
}

export function getBookingPayments(bookingId) {
    return client.get(`/payments/booking/${bookingId}`).then((r) => r.data);
}

/** Admin: subscription payments awaiting confirmation. */
export function getPendingPayments() {
    return client.get("/payments/pending").then((r) => r.data);
}

export function confirmPayment(id) {
    return client.patch(`/payments/${id}/confirm`).then((r) => r.data);
}

export function rejectPayment(id) {
    return client.patch(`/payments/${id}/reject`).then((r) => r.data);
}
