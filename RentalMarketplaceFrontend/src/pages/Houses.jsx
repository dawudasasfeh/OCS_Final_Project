import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchHouses } from "../api/houses";
import { getErrorMessage } from "../api/errors";
import HouseCard from "../components/HouseCard";
import FilterSelect from "../components/FilterSelect";
import Autocomplete from "../components/Autocomplete";
import { cityOptions } from "../utils/cities";
import { useTranslation } from "react-i18next";

// Values stay the integers the API filters on; only the label is translated.
// The lists hold keys rather than text because they live outside the component,
// where t does not exist — they are resolved in buildOptions below.
const TYPE_KEYS = [
  { value: "1", key: "propertyType.apartment" },
  { value: "2", key: "propertyType.house" },
  { value: "3", key: "propertyType.villa" },
  { value: "4", key: "propertyType.studio" },
];

const PERIOD_KEYS = [
  { value: "1", key: "period.weekly" },
  { value: "2", key: "period.monthly" },
  { value: "3", key: "period.yearly" },
];

const FURNISHING_KEYS = [
  { value: "true", key: "houses.furnished" },
  { value: "false", key: "houses.unfurnished" },
];

const SORT_KEYS = [
  { value: "newest", key: "houses.newestFirst" },
  { value: "priceAsc", key: "houses.priceLowHigh" },
  { value: "priceDesc", key: "houses.priceHighLow" },
  { value: "areaDesc", key: "houses.sortAreaLargest" },
];

const resolve = (t, list) => list.map((o) => ({ value: o.value, label: t(o.key) }));

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
  const { t } = useTranslation();

  // Rebuilt when the language changes, so an open filter bar relabels in place
  // rather than keeping the words it was first rendered with.
  const TYPES = useMemo(() => resolve(t, TYPE_KEYS), [t]);
  const PERIODS = useMemo(() => resolve(t, PERIOD_KEYS), [t]);
  const FURNISHING = useMemo(() => resolve(t, FURNISHING_KEYS), [t]);
  const SORTS = useMemo(() => resolve(t, SORT_KEYS), [t]);
  const BEDROOMS = useMemo(
    () => [1, 2, 3, 4].map((n) => ({ value: String(n), label: t("houses.bedsPlus", { count: n }) })),
    [t]
  );
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

  // Only the price boxes need debouncing. City is typed too, but it commits a
  // whole city rather than each keystroke, so it applies on pick. Prices have
  // no such moment — without the pause, typing 1000 searches for 1 on the way.
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


  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchHouses(Object.fromEntries(searchParams));
        if (!cancelled) setHouses(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, t("houses.couldNotLoad")));
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
  if (get("city")) chips.push({ key: "city", label: t(`city.${get("city")}`, { defaultValue: get("city") }) });
  if (get("propertyType")) chips.push({ key: "propertyType", label: labelOf(TYPES, get("propertyType")) });
  if (get("priceUnit")) chips.push({ key: "priceUnit", label: labelOf(PERIODS, get("priceUnit")) });
  if (get("bedrooms")) chips.push({ key: "bedrooms", label: labelOf(BEDROOMS, get("bedrooms")) });
  if (get("minPrice")) chips.push({ key: "minPrice", label: t("houses.fromPrice", { amount: get("minPrice") }) });
  if (get("maxPrice")) chips.push({ key: "maxPrice", label: t("houses.upToPrice", { amount: get("maxPrice") }) });
  if (get("isFurnished")) chips.push({ key: "isFurnished", label: labelOf(FURNISHING, get("isFurnished")) });

  const clearAll = () => setSearchParams({});

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>{t("houses.title")}</h1>
          <p>{t("houses.subtitle")}</p>
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
            {t("houses.filters")}{chips.length > 0 && ` (${chips.length})`}
          </button>

          {/* Compact labels above each control. They cost about 20px in total,
              not the extra row the old stacked layout needed, and a bare row of
              inputs is harder to scan than it looks. */}
          <div className={barOpen ? "filter-bar open" : "filter-bar"}>
            {/* The same control the home search uses. City is the one filter
                with enough options to be worth typing, and having it behave
                one way on the home page and another here was the odd part. */}
            <div className="filter-field">
              <label className="filter-label" htmlFor="f-city">{t("houses.city")}</label>
              <Autocomplete
                id="f-city" label={t("houses.city")} placeholder={t("houses.anyCity")}
                options={cityOptions(t, cityCounts)}
                value={get("city")}
                onChange={(v) => setFilter("city", v)}
              />
            </div>

            <FilterSelect
              id="f-type" label={t("houses.type")} placeholder={t("houses.anyType")}
              options={TYPES}
              value={get("propertyType")}
              onChange={(v) => setFilter("propertyType", v)}
            />

            <FilterSelect
              id="f-period" label={t("houses.period")} placeholder={t("houses.anyPeriod")}
              options={PERIODS}
              value={get("priceUnit")}
              onChange={(v) => setFilter("priceUnit", v)}
            />

            <FilterSelect
              id="f-beds" label={t("houses.bedrooms")} placeholder={t("houses.anyBeds")}
              options={BEDROOMS}
              value={get("bedrooms")}
              onChange={(v) => setFilter("bedrooms", v)}
            />

            <div className="filter-field">
              <label className="filter-label" htmlFor="f-min">{t("houses.minPrice")}</label>
              <input id="f-min" className="input" type="number" min="0"
                     placeholder={t("houses.any")}
                     value={draft.min} onChange={(e) => type("min", e.target.value)} />
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="f-max">{t("houses.maxPrice")}</label>
              <input id="f-max" className="input" type="number" min="0"
                     placeholder={t("houses.any")}
                     value={draft.max} onChange={(e) => type("max", e.target.value)} />
            </div>

            <FilterSelect
              id="f-furnished" label={t("houses.furnishing")} placeholder={t("houses.any")}
              options={FURNISHING}
              value={get("isFurnished")}
              onChange={(v) => setFilter("isFurnished", v)}
            />
          </div>

          <div>
            {error && <p className="error-text">{error}</p>}

            <div className="results-head">
              <p className="results-count">
                {loading ? t("houses.searching") : t("common.results", { count: houses.length })}
              </p>

              {houses.length > 1 && (
                <div className="results-sort">
                  <FilterSelect
                    id="f-sort" label={t("houses.sort")} placeholder={t("houses.newestFirst")}
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
                          aria-label={t("houses.removeFilter", { label: c.label })}>
                    {c.label}<span aria-hidden="true">×</span>
                  </button>
                ))}
                <button type="button" className="link-btn" onClick={clearAll}>{t("houses.clearAll")}</button>
              </div>
            )}

            {!loading && !error && (
              houses.length === 0 ? (
                <div className="empty-state">
                  <p>{t("houses.noMatchFilters")}</p>
                  <button className="btn btn-outline" type="button" onClick={clearAll}>
                    {t("houses.clearFilters")}
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
