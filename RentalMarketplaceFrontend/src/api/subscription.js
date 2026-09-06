import client from "./client";

/**
 * The caller's subscription, read from the database.
 *
 * Use this rather than AuthContext's user.isSubscribed: that comes from the
 * JWT, which is stamped at login and stays false until the user signs in again
 * even after an admin has confirmed their payment.
 */
export function getMySubscription() {
    return client.get("/subscription/me").then((r) => r.data);
}

export function grantSubscription(userId) {
    return client.patch(`/subscription/${userId}/grant`).then((r) => r.data);
}

export function revokeSubscription(userId) {
    return client.patch(`/subscription/${userId}/revoke`).then((r) => r.data);
}
