export function formatDay(iso) {
    if(!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m-1, d).toLocaleDateString("en-GB",{
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// The API sends DateOnly as "2026-10-01". Passing that straight to `new Date()`
// parses it as UTC midnight, which lands on the previous day for anyone west of
// UTC. Building from the parts gives a local date that always matches what the
// server said.
export function parseDay(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
}

export function toIso(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const todayIso = () => toIso(new Date());

export function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

// .NET's AddMonths clamps to the last valid day — 31 Jan plus one month is
// 28 Feb. JavaScript's setMonth overflows into March instead, so a booking
// starting on the 31st would compute a different end date here than on the
// server. Clamp to match.
export function addMonths(date, n) {
    const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(date.getDate(), lastDay));
    return d;
}

export function addYears(date, n) {
    return addMonths(date, n * 12);
}

/// Mirrors EndDateFor in BookingService. The end date is exclusive: it is the
/// checkout day, not the last night.
export function endOfStay(startIso, durationType, count) {
    const start = parseDay(startIso);
    if (durationType === "Weekly") return addDays(start, count * 7);
    if (durationType === "Monthly") return addMonths(start, count);
    if (durationType === "Yearly") return addYears(start, count);
    return start;
}
