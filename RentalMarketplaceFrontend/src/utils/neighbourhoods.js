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
 * Amman has some seventy districts people search by; Tafilah has about ten
 * towns, and padding it out would mean inventing place names. For the
 * governorates outside the big cities these are the towns listings are
 * actually advertised under rather than urban quarters, which is how those
 * areas work.
 *
 * Each array is kept alphabetical by key for the diff's sake only; what the
 * reader sees is sorted by its translated label in neighbourhoodOptions.
 */
export const NEIGHBOURHOODS = {
  Amman: [
    "7th Circle", "Abdali", "Abdoun", "Abu Alanda", "Abu Nseir", "Ain Ghazal",
    "Airport Road", "Arjan", "Al Ashrafiyeh", "Badr Al Jadida", "Al Bayader",
    "Al Bnayyat", "Dabouq", "Dahiat Al Amir Rashid", "Dahiat Al Aqsa",
    "Dahiat Al Rasheed", "Dahiat Al Yasmin", "Deir Ghbar", "Downtown Amman",
    "Al Gardens", "Al Hashmi Al Shamali", "Hay Nazzal", "Al Hummar",
    "Jabal Al Hussain", "Jabal Al Jofeh", "Jabal Al Nasr", "Jabal Al Nuzha",
    "Jabal Al Qusour", "Jabal Al Taj", "Jabal Al Weibdeh", "Jabal Amman",
    "Al Jandaweel", "Al Jizah", "Jubaiha", "Al Jweideh", "Al Kamaliya",
    "Khalda", "Khirbet Al Souq", "Al Kursi", "Al Madina Al Riyadiya",
    "Al Mahatta", "Marj El Hamam", "Marka", "Mecca Street", "Al Muhajireen",
    "Al Muqabalain", "Al Muwaqqar", "Naour", "Al Qweismeh", "Al Rabiah",
    "Ras Al Ain", "Al Rawabi", "Sahab", "Shafa Badran", "Shmaisani",
    "Swefieh", "Sweileh", "Tabarbour", "Tareq", "Tla' Al Ali", "Um Al Heiran",
    "Um Nuwwara", "Um Al Summaq", "Um Uthaina", "Wadi Saqra", "Wadi Al Seer",
    "Al Wehdat", "Al Yadudah",
  ],
  Irbid: [
    "Al Afrah", "Al Barha", "Beit Ras", "Bushra", "Deir Abi Said", "Hakama",
    "Hawwara", "Al Hay Al Janoubi", "Al Hay Al Shamali", "Al Hay Al Sharqi",
    "Al Hosn", "Idoon", "Irbid Centre", "Kufr Asad", "Kufr Jayez",
    "Kufr Yuba", "Al Mazar Al Shamali", "Al Naimeh", "Al Naseem", "Al Nuzha",
    "Ramtha", "Sal", "Al Sareeh", "Al Shuna Al Shamaliya", "Al Taybeh",
    "Al Turkman", "Um Qais", "University Street",
  ],
  Zarqa: [
    "Awajan", "Al Azraq", "Al Batrawi", "Birayn", "Al Dhlail",
    "Al Ghweiriyeh", "Al Hallabat", "Al Hashemiyya", "Hay Masoum",
    "Al Jabal Al Abyad", "Al Jabal Al Shamali", "Jabal Al Amir Faisal",
    "Jabal Tareq", "New Zarqa", "Russeifa", "Al Sukhneh", "Zarqa Centre",
    "Al Zawahra",
  ],
  Aqaba: [
    "Ayla", "Downtown Aqaba", "Al Karama", "Al Naeem", "Al Quwayra",
    "Al Rimal", "Al Sakaneyeh 1", "Al Sakaneyeh 2", "Al Sakaneyeh 3",
    "Al Sakaneyeh 4", "Al Sakaneyeh 5", "Al Sakaneyeh 6", "Al Sakaneyeh 7",
    "Al Sakaneyeh 8", "Al Sakaneyeh 9", "Al Shallaleh", "Al Shamiya",
    "South Beach", "Tala Bay", "Wadi Rum",
  ],
  Salt: [
    "Ain Al Basha", "Ain Jadour", "Al Allan", "Al Baqa'a", "Deir Alla",
    "Al Fuheis", "Al Jadaa", "Al Karama", "Mahis", "Al Qala'a", "Al Salalem",
    "Salt Centre", "Al Sarou", "South Shuna", "Wadi Shu'aib", "Yarqa", "Zay",
  ],
  Madaba: [
    "Dhiban", "Al Faisaliyah", "Hanina", "Jarina", "Libb", "Ma'in",
    "Madaba Centre", "Mlaih", "Mount Nebo", "Mukawir", "Um Al Rasas",
  ],
  Jerash: [
    "Balila", "Burma", "Dibbeen", "Jerash Centre", "Al Kittah", "Kufr Khall",
    "Al Mastaba", "Nihla", "Qafqafa", "Raymoun", "Sakib", "Souf",
  ],
  Ajloun: [
    "Ain Janna", "Ajloun Centre", "Anjara", "Halawa", "Ibbin", "Irjan",
    "Ishtafaina", "Kufranjah", "Rasoun", "Sakhra", "Al Wahadneh",
  ],
  Mafraq: [
    "Al Bal'ama", "Hosha", "Al Khalidiya", "Mafraq Centre", "Rihab",
    "Ruwaished", "Sabha", "Sama Al Sirhan", "Um Al Jimal", "Um Al Quttain",
    "Al Za'atari",
  ],
  Karak: [
    "Adir", "Ay", "Faqou'", "Ghor Al Safi", "Karak Centre", "Al Marj",
    "Al Mazar Al Janoubi", "Al Mazraa", "Mu'tah", "Al Qasr", "Al Qatraneh",
    "Al Rabba", "Al Thaniyya",
  ],
  Tafilah: [
    "Al Aima", "Ain Al Bayda", "Busaira", "Dana", "Al Eis", "Gharandal",
    "Al Hasa", "Al Qadisiyah", "Al Rashadiya", "Sel'", "Tafilah Centre",
  ],
  "Ma'an": [
    "Al Husseiniyya", "Al Jafr", "Ma'an Centre", "Al Mureigha", "Petra",
    "Ras Al Naqab", "Al Shobak", "Al Taybeh", "Udhruh", "Um Seyhoun",
    "Wadi Musa",
  ],
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
  (NEIGHBOURHOODS[city] ?? [])
    .map((n) => ({
      value: n,
      label: t(`neighborhood.${n}`, { defaultValue: n }),
    }))
    // By label, so an Arabic reader scanning seventy Amman districts finds
    // them in Arabic order rather than the order of their English keys.
    .sort((a, b) => a.label.localeCompare(b.label));

/** True when this neighbourhood is one the given city actually has. */
export const belongsToCity = (city, neighbourhood) =>
  !neighbourhood || (NEIGHBOURHOODS[city] ?? []).includes(neighbourhood);

/**
 * Every city, then every neighbourhood as "Abdoun, Amman", for a search box
 * that takes either. A neighbourhood's value carries its city
 * ("Amman|Abdoun"), because the same name can be in two governorates —
 * Al Karama is in Aqaba and in Salt.
 *
 * Neighbourhoods are typedOnly: the list opens on the twelve cities with
 * their counts, and the neighbourhoods join once something is typed. Each
 * also matches on its English name, so "abdoun" finds عبدون on an Arabic
 * page.
 */
export const placeOptions = (t, cities) => [
  ...cities.map((c) => ({ ...c, keywords: c.value })),
  ...Object.entries(NEIGHBOURHOODS).flatMap(([city, list]) => {
    const cityLabel = t(`city.${city}`, { defaultValue: city });
    return list.map((n) => ({
      value: `${city}|${n}`,
      label: t("home.placeInCity", {
        place: t(`neighborhood.${n}`, { defaultValue: n }),
        city: cityLabel,
      }),
      keywords: `${n} ${city}`,
      typedOnly: true,
    }));
  }),
];
