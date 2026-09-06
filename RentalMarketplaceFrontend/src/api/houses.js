import client from "./client";
export function searchHouses(filters = {}){
    const params = Object.fromEntries(
        Object.entries(filters).filter(
            ([, v]) => v !== "" && v!==null && v!== undefined
        )
    );
    return client.get("/houses",{params}).then((r) => r.data);
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


