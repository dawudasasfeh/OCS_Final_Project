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


