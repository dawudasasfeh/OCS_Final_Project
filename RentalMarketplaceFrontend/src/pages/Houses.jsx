import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchHouses } from "../api/houses";
import { getErrorMessage } from "../api/errors";
import HouseCard from "../components/HouseCard";
import FilterSelect from "../components/FilterSelect";

const TYPES = [
  { value: "1", label: "Apartment" },
  { value: "2", label: "House" },
  { value: "3", label: "Villa" },
  { value: "4", label: "Studio" },
];

const PERIODS = [
  { value: "1", label: "Weekly" },
  { value: "2", label: "Monthly" },
  { value: "3", label: "Yearly" },
];

const BEDROOMS = [
  { value: "1", label: "1+ bed" },
  { value: "2", label: "2+ beds" },
  { value: "3", label: "3+ beds" },
  { value: "4", label: "4+ beds" },
];

const FURNISHING = [
  { value: "true", label: "Furnished" },
  { value: "false", label: "Unfurnished" },
];

// Every governorate seat, in the order Jordanian listing sites use. Listing
// them all means someone from Karak can search Karak and be told there is
// nothing yet, rather than concluding the site does not cover them.
const JORDAN_CITIES = [
  "Amman", "Irbid", "Zarqa", "Aqaba", "Salt", "Madaba",
  "Jerash", "Ajloun", "Mafraq", "Karak", "Tafilah", "Ma'an",
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "priceAsc", label: "Price: low to high" },
  { value: "priceDesc", label: "Price: high to low" },
  { value: "areaDesc", label: "Area: largest first" },
];

// A weekly 175 and a yearly 35,000 cannot be compared as raw numbers, so price
// sorting normalises everything to a monthly figure first.
const MONTHLY = { Weekly: 4.345, Monthly: 1, Yearly: 1 / 12 };
const monthlyPrice = (h) => h.price * (MONTHLY[h.priceUnit] ?? 1);

const labelOf = (list, value) => list.find((o) => o.value === value)?.label ?? value;

export default function Houses() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [houses, setHouses] = useState([]);
  const [cityCounts, setCityCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("newest");
  const [barOpen, setBarOpen] = useState(false);

  // The URL is the only source of truth. Nothing is mirrored into component
  // state, so a footer link, the back button and the bar cannot disagree.
  const get = (k) => searchParams.get(k) ?? "";

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === "" || value == null) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  // Only the price boxes are typed now — the city search happens inside the
  // dropdown and commits on pick, so it needs no debounce. Applying prices on
  // every keystroke would search for "1" on the way to "1000".
  const [draft, setDraft] = useState({ min: get("minPrice"), max: get("maxPrice") });
  const typing = useRef(false);

  useEffect(() => {
    if (typing.current) return;
    setDraft({ min: get("minPrice"), max: get("maxPrice") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!typing.current) return;
    const id = setTimeout(() => {
      typing.current = false;
      const next = new URLSearchParams(searchParams);
      draft.min ? next.set("minPrice", draft.min) : next.delete("minPrice");
      draft.max ? next.set("maxPrice", draft.max) : next.delete("maxPrice");
      setSearchParams(next, { replace: true });
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function type(which, value) {
    typing.current = true;
    setDraft((d) => ({ ...d, [which]: value }));
  }

  const cityOptions = JORDAN_CITIES.map((c) => ({
    value: c,
    label: c,
    hint: cityCounts[c] ? String(cityCounts[c]) : undefined,
  }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchHouses(Object.fromEntries(searchParams));
        if (!cancelled) setHouses(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Could not load listings."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams]);

  // Counts come from the data so the suggestions can say which cities actually
  // have something, without hiding the ones that do not.
  useEffect(() => {
    let cancelled = false;
    searchHouses({})
      .then((all) => {
        if (cancelled) return;
        const counts = {};
        for (const h of all) if (h.city) counts[h.city] = (counts[h.city] ?? 0) + 1;
        setCityCounts(counts);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const sorted = useMemo(() => {
    const list = [...houses];
    switch (sort) {
      case "priceAsc": return list.sort((a, b) => monthlyPrice(a) - monthlyPrice(b));
      case "priceDesc": return list.sort((a, b) => monthlyPrice(b) - monthlyPrice(a));
      case "areaDesc": return list.sort((a, b) => (b.areaSqM ?? 0) - (a.areaSqM ?? 0));
      default: return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [houses, sort]);

  const chips = [];
  if (get("city")) chips.push({ key: "city", label: get("city") });
  if (get("propertyType")) chips.push({ key: "propertyType", label: labelOf(TYPES, get("propertyType")) });
  if (get("priceUnit")) chips.push({ key: "priceUnit", label: labelOf(PERIODS, get("priceUnit")) });
  if (get("bedrooms")) chips.push({ key: "bedrooms", label: labelOf(BEDROOMS, get("bedrooms")) });
  if (get("minPrice")) chips.push({ key: "minPrice", label: `From ${get("minPrice")} JOD` });
  if (get("maxPrice")) chips.push({ key: "maxPrice", label: `Up to ${get("maxPrice")} JOD` });
  if (get("isFurnished")) chips.push({ key: "isFurnished", label: labelOf(FURNISHING, get("isFurnished")) });

  const clearAll = () => setSearchParams({});

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Properties</h1>
          <p>Browse homes available to rent across Jordan.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">

          <button
            type="button"
            className="filter-toggle btn btn-outline"
            onClick={() => setBarOpen((v) => !v)}
            aria-expanded={barOpen}
          >
            Filters{chips.length > 0 && ` (${chips.length})`}
          </button>

          {/* Compact labels above each control. They cost about 20px in total,
              not the extra row the old stacked layout needed, and a bare row of
              inputs is harder to scan than it looks. */}
          <div className={barOpen ? "filter-bar open" : "filter-bar"}>
            <FilterSelect
              id="f-city" label="City" placeholder="Any city" searchable
              options={cityOptions}
              value={get("city")}
              onChange={(v) => setFilter("city", v)}
            />

            <FilterSelect
              id="f-type" label="Type" placeholder="Any type"
              options={TYPES}
              value={get("propertyType")}
              onChange={(v) => setFilter("propertyType", v)}
            />

            <FilterSelect
              id="f-period" label="Period" placeholder="Any period"
              options={PERIODS}
              value={get("priceUnit")}
              onChange={(v) => setFilter("priceUnit", v)}
            />

            <FilterSelect
              id="f-beds" label="Bedrooms" placeholder="Any beds"
              options={BEDROOMS}
              value={get("bedrooms")}
              onChange={(v) => setFilter("bedrooms", v)}
            />

            <div className="filter-field">
              <label className="filter-label" htmlFor="f-min">Min price</label>
              <input id="f-min" className="input" type="number" min="0"
                     placeholder="Any"
                     value={draft.min} onChange={(e) => type("min", e.target.value)} />
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="f-max">Max price</label>
              <input id="f-max" className="input" type="number" min="0"
                     placeholder="Any"
                     value={draft.max} onChange={(e) => type("max", e.target.value)} />
            </div>

            <FilterSelect
              id="f-furnished" label="Furnishing" placeholder="Any"
              options={FURNISHING}
              value={get("isFurnished")}
              onChange={(v) => setFilter("isFurnished", v)}
            />
          </div>

          <div>
            {error && <p className="error-text">{error}</p>}

            <div className="results-head">
              <p className="results-count">
                {loading ? "Searching…"
                  : `${houses.length} ${houses.length === 1 ? "property" : "properties"} found`}
              </p>

              {houses.length > 1 && (
                <div className="results-sort">
                  <FilterSelect
                    id="f-sort" label="Sort" placeholder="Newest first"
                    options={SORTS.filter((o) => o.value !== "newest")}
                    value={sort === "newest" ? "" : sort}
                    onChange={(v) => setSort(v || "newest")}
                  />
                </div>
              )}
            </div>

            {chips.length > 0 && (
              <div className="chip-row">
                {chips.map((c) => (
                  <button key={c.key} type="button" className="chip"
                          onClick={() => setFilter(c.key, "")}
                          aria-label={`Remove filter ${c.label}`}>
                    {c.label}<span aria-hidden="true">×</span>
                  </button>
                ))}
                <button type="button" className="link-btn" onClick={clearAll}>Clear all</button>
              </div>
            )}

            {!loading && !error && (
              houses.length === 0 ? (
                <div className="empty-state">
                  <p>No properties match these filters.</p>
                  <button className="btn btn-outline" type="button" onClick={clearAll}>
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid-houses">
                  {sorted.map((h) => <HouseCard key={h.id} house={h} />)}
                </div>
              )
            )}
          </div>

        </div>
      </section>
    </>
  );
}
