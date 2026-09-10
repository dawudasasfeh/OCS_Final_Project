/**
 * Every Jordanian governorate seat, in the order local listing sites use —
 * roughly by population.
 *
 * Shared by the home search and the listings filter so the two cannot drift
 * apart, which is how the footer ended up advertising a city the platform had
 * never had a listing in.
 *
 * All of them are offered rather than only the ones with listings: someone from
 * Karak should be told there is nothing there yet, not left thinking the site
 * does not cover them. The counts alongside each say which are empty.
 */
export const JORDAN_CITIES = [
  "Amman", "Irbid", "Zarqa", "Aqaba", "Salt", "Madaba",
  "Jerash", "Ajloun", "Mafraq", "Karak", "Tafilah", "Ma'an",
];

/** Shapes the list for FilterSelect, annotating each city with its count. */
/**
 * Takes t so the label can be Arabic while the value stays the English name the
 * API filters on — translating the value would send "عمّان" to a server that has
 * only ever stored "Amman".
 */
export const cityOptions = (t, counts = {}) =>
  JORDAN_CITIES.map((c) => ({
    value: c,
    label: t(`city.${c}`, { defaultValue: c }),
    hint: counts[c] ? String(counts[c]) : undefined,
  }));
