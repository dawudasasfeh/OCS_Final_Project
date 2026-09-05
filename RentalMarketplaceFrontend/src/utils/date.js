export function formatDay(iso) {
    if(!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m-1, d).toLocaleDateString("en-GB",{
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}