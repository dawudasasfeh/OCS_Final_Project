/**
 * Neighbourhoods, grouped by the city they belong to.
 *
 * Built the same way as JORDAN_CITIES, and for the same reason: the value
 * stored on a listing and sent to the API is the English key, and only the
 * label is translated. A neighbourhood used to be free text, which is why
 * "7th Circle" stayed Latin on an Arabic page — there was nothing to look the
 * translation up by.
 *
 * The keys are the strings already in the database, apostrophes, digits and
 * spaces included. JORDAN_CITIES already uses "Ma'an" as a key, so the
 * convention holds, and keeping them means no migration: every listing that
 * exists today already stores a value this map recognises.
 *
 * Unlike the city list this is not the same length everywhere, on purpose.
 * Amman really does have twenty districts people search by; Tafilah does not,
 * and padding it out would mean inventing place names. For the governorates
 * outside the big cities these are the towns listings are actually advertised
 * under rather than urban quarters, which is how those areas work.
 */
export const NEIGHBOURHOODS = {
  Amman: [
    "Abdoun", "Abu Nseir", "Al Bayader", "Al Kursi", "Al Rabiah", "Dabouq",
    "Deir Ghbar", "Jabal Al Hussain", "Jabal Al Weibdeh", "Jabal Amman",
    "Jubaiha", "Khalda", "Marj El Hamam", "7th Circle", "Shafa Badran",
    "Shmaisani", "Sweileh", "Swefieh", "Tabarbour", "Tla' Al Ali",
    "Um Uthaina", "Wadi Saqra",
  ],
  Irbid: [
    "Al Barha", "Al Hosn", "Al Naseem", "Al Sareeh", "Bushra", "Hakama",
    "Idoon", "University Street",
  ],
  Zarqa: [
    "Al Hashemiyya", "Al Jabal Al Abyad", "Awajan", "Birayn", "New Zarqa",
    "Russeifa",
  ],
  Aqaba: [
    "Al Naeem", "Al Rimal", "Al Sakaneyeh 5", "Al Shamiya", "Downtown Aqaba",
  ],
  Salt: ["Ain Jadour", "Al Qala'a", "Al Salalem", "Wadi Shu'aib"],
  Madaba: ["Hanina", "Ma'in", "Madaba Centre", "Mount Nebo"],
  Jerash: ["Burma", "Nihla", "Sakib", "Souf"],
  Ajloun: ["Ain Janna", "Ajloun Centre", "Anjara", "Kufranjah"],
  Mafraq: ["Al Bal'ama", "Mafraq Centre", "Sabha", "Um Al Jimal"],
  Karak: ["Al Mazar Al Janoubi", "Al Qasr", "Karak Centre", "Mu'tah"],
  Tafilah: ["Ain Al Bayda", "Al Hasa", "Busaira", "Tafilah Centre"],
  "Ma'an": ["Al Husseiniyya", "Al Jafr", "Ma'an Centre", "Wadi Musa"],
};

/**
 * Shapes one city's neighbourhoods for Autocomplete, the same control and the
 * same { value, label } split the city field uses — value stays English for
 * the API, label is whatever the reader's language calls it.
 *
 * An unknown city returns nothing rather than throwing, so a listing created
 * before this list existed cannot break the form.
 */
export const neighbourhoodOptions = (t, city) =>
  (NEIGHBOURHOODS[city] ?? []).map((n) => ({
    value: n,
    label: t(`neighborhood.${n}`, { defaultValue: n }),
  }));

/** True when this neighbourhood is one the given city actually has. */
export const belongsToCity = (city, neighbourhood) =>
  !neighbourhood || (NEIGHBOURHOODS[city] ?? []).includes(neighbourhood);
