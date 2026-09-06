import client from "./client";

export function getApprovedTestimonials() {
    return client.get("/testimonials").then((r) => r.data);
}

export function createTestimonial(content) {
    return client.post("/testimonials", { content }).then((r) => r.data);
}

export function getPendingTestimonials() {
    return client.get("/testimonials/pending").then((r) => r.data);
}

export function approveTestimonial(id) {
    return client.patch(`/testimonials/${id}/approve`).then((r) => r.data);
}

export function rejectTestimonial(id) {
    return client.patch(`/testimonials/${id}/reject`).then((r) => r.data);
}
