import client from "./client";

/** The caller's saved listings, as HouseDto so they render with HouseCard. */
export function getWishlist() {
    return client.get("/wishlist").then((r) => r.data);
}

export function addToWishlist(houseId) {
    return client.post(`/wishlist/${houseId}`).then((r) => r.data);
}

export function removeFromWishlist(houseId) {
    return client.delete(`/wishlist/${houseId}`).then((r) => r.data);
}
