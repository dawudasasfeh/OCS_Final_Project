import client from "./client";
/**
 * FR-1.4 — one page of approved listings.
 *
 * Resolves to the page object the API returns, not a bare array:
 * { items, page, pageSize, totalCount, totalPages, hasPrevious, hasNext }.
 * The count is the point — twelve listings say nothing about whether there
 * are thirty more behind them, and a pager cannot be drawn without it.
 */
export function searchHouses(filters = {}){
    const params = Object.fromEntries(
        Object.entries(filters).filter(
            ([, v]) => v !== "" && v!==null && v!== undefined
        )
    );
    return client.get("/houses",{params}).then((r) => r.data);
}

/**
 * How many available listings each city has, for the search suggestions.
 *
 * Its own call because the search is paged now: these counts used to be
 * tallied from a full download of every listing, which is exactly what
 * pagination stopped the browser receiving.
 */
export function getCityCounts(){
    return client.get(`/houses/city-counts`).then((r) => r.data);
}

export function getHouse(id){
    return client.get(`/houses/${id}`).then((r) => r.data);
}

export function getMyHouses(){
    return client.get(`/houses/mine`).then((r) => r.data);
}

export function createHouse(dto){
    return client.post(`/houses`,dto).then((r) => r.data);
}

export function getPendingHouses(){
    return client.get(`/houses/pending`).then((r) => r.data);
}

export function approveHouse(id){
    return client.patch(`/houses/${id}/approve`).then((r) => r.data);
}

export function rejectHouse(id){
    return client.patch(`/houses/${id}/reject`).then((r) => r.data);
}

/**
 * Adds one photo to an existing listing and resolves to its stored path.
 * Content-Type is cleared so the browser sets it, including the multipart
 * boundary that the client's default "application/json" would otherwise hide.
 */
export function uploadHouseImage(houseId, file){
    const body = new FormData();
    body.append("file", file);

    return client
        .post(`/houses/${houseId}/images`, body, { headers: { "Content-Type": undefined } })
        .then((r) => r.data.url);
}



/**
 * FR-2.7 — replaces the editable fields of a listing the caller owns.
 *
 * Images are not part of the payload: they have their own endpoint, so editing
 * a title cannot silently drop a photo the owner never mentioned.
 */
export function updateHouse(id, dto){
    return client.put(`/houses/${id}`, dto).then((r) => r.data);
}

/**
 * FR-2.8 — takes a listing off the market, or puts it back, without deleting
 * it. Bookings already placed against it are unaffected.
 */
export function setHouseAvailability(id, isAvailable){
    return client.patch(`/houses/${id}/availability`, { isAvailable }).then((r) => r.data);
}
