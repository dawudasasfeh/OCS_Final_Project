import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { searchHouses } from "../api/houses";
import Autocomplete from "./Autocomplete";
import FilterSelect from "./FilterSelect";
import { cityOptions } from "../utils/cities";
import { placeOptions } from "../utils/neighbourhoods";
import { IconClose, IconSearch } from "./icons";

// Enum integers the API filters on, with their labels.
const TYPES = [
  { value: "1", key: "propertyType.apartment" },
  { value: "2", key: "propertyType.house" },
  { value: "3", key: "propertyType.villa" },
  { value: "4", key: "propertyType.studio" },
];

const PERIODS = [
  { value: "1", key: "period.weekly" },
  { value: "2", key: "period.monthly" },
  { value: "3", key: "period.yearly" },
];

// Budget ranges in JOD, one scale per rental period. A single scale cannot
// work: 200 is a week in a studio and a fraction of a month in a villa, and
// the API filters on the listed price as it stands, whatever its period.
// With no period chosen the monthly scale is offered, and picking a range
// sets the period to monthly — visibly, in the period field.
const BUDGETS = {
  1: [[null, 100], [100, 200], [200, 400], [400, null]],
  2: [[null, 250], [250, 500], [500, 1000], [1000, null]],
  3: [[null, 5000], [5000, 15000], [15000, 40000], [40000, null]],
};

/**
 * The home page search.
 *
 * Location comes first because it is the first thing anyone decides. Nothing
 * is preselected: the old search started on Apartment + Monthly with no way
 * to clear them, which quietly hid more than half the listings. The button
 * says how many listings the current choice finds, so an empty search is
 * visible before it is run rather than after.
 *
 * Desktop and tablet get one bar. On a phone the same form becomes a
 * full-screen sheet behind a single field: a form of five controls stacked in
 * the hero pushed every listing below the first screen, and a sheet is where
 * a thumb expects to fill one in.
 */
export default function HeroSearch({ cityCounts = {} }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [place, setPlace] = useState("");     // "Amman" or "Amman|Abdoun"
  const [type, setType] = useState("");
  const [period, setPeriod] = useState("");
  const [budget, setBudget] = useState("");   // "min-max", either end may be empty
  const [count, setCount] = useState(null);
  const [open, setOpen] = useState(false);    // the phone sheet

  const triggerRef = useRef(null);
  const formRef = useRef(null);

  const filters = useMemo(() => {
    const f = {};
    if (place) {
      const [city, neighborhood] = place.split("|");
      f.city = city;
      if (neighborhood) f.neighborhood = neighborhood;
    }
    if (type) f.propertyType = type;
    if (period) f.priceUnit = period;
    if (budget) {
      const [min, max] = budget.split("-");
      if (min) f.minPrice = min;
      if (max) f.maxPrice = max;
    }
    return f;
  }, [place, type, period, budget]);

  // The count on the button. Debounced, so arrowing through a list is one
  // request rather than one per option, and a late reply to an earlier
  // choice is dropped.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      searchHouses({ ...filters, pageSize: 1 })
        .then((r) => { if (!cancelled) setCount(r.totalCount); })
        .catch(() => { if (!cancelled) setCount(null); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters]);

  // The sheet behaves as a dialog: the page behind it stops scrolling, Escape
  // closes it, and focus moves to its title and back to the field that opened
  // it. Not to the location box: focusing that opens its list of cities over
  // the chips below, so the first tap on a chip picked a city instead.
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    formRef.current?.querySelector("#hs-title")?.focus();

    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  function choosePeriod(value) {
    setPeriod(value);
    setBudget("");            // the ranges belong to the period
  }

  function chooseBudget(value) {
    setBudget(value);
    if (value && !period) setPeriod("2");
  }

  function clearAll() {
    setPlace(""); setType(""); setPeriod(""); setBudget("");
  }

  function submit(e) {
    e.preventDefault();
    setOpen(false);
    const query = new URLSearchParams(filters).toString();
    navigate(query ? `/houses?${query}` : "/houses");
  }

  const places = placeOptions(t, cityOptions(t, cityCounts));
  const selectedPlace = places.find((o) => o.value === place);

  const budgetOptions = BUDGETS[period || 2].map(([min, max]) => ({
    value: `${min ?? ""}-${max ?? ""}`,
    label: min == null ? t("home.budgetUpTo", { max })
      : max == null ? t("home.budgetFrom", { min })
      : t("home.budgetRange", { min, max }),
  }));

  const cta = count === null ? t("common.find")
    : count === 0 ? t("home.noMatches")
    : t("home.showCount", { count });

  // The cities with the most listings, from the counts the API already
  // keeps. Real numbers, not a list of places someone thought were popular.
  const popular = Object.entries(cityCounts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const chips = (name, items, value, onPick, anyKey) => (
    <div className={`type-chips type-chips-${items.length + 1}`}>
      {[{ value: "", key: anyKey }, ...items].map((o) => (
        <label key={o.value} className={o.value === value ? "type-chip selected" : "type-chip"}>
          <input type="radio" name={name} value={o.value} checked={o.value === value}
                 onChange={() => onPick(o.value)} />
          {t(o.key)}
        </label>
      ))}
    </div>
  );

  const form = (
    <form ref={formRef} className={open ? "hs open" : "hs"} onSubmit={submit}
          role={open ? "dialog" : undefined} aria-modal={open || undefined}
          aria-labelledby={open ? "hs-title" : undefined}>
      <div className="hs-head">
        <h2 id="hs-title" className="hs-title" tabIndex={-1}>{t("home.searchSheetTitle")}</h2>
        <button type="button" className="hs-close" aria-label={t("home.closeSearch")}
                onClick={() => setOpen(false)}>
          <IconClose size={20} />
        </button>
      </div>

      <div className="hs-fields">
        <div className="hs-field hs-place">
          <label className="filter-label" htmlFor="hero-place">{t("home.placeLabel")}</label>
          <Autocomplete
            id="hero-place"
            label={t("home.placeLabel")}
            placeholder={t("home.searchPlaceholder")}
            emptyText={t("select.noMatchingPlace")}
            options={places}
            value={place}
            onChange={setPlace}
          />
        </div>

        {/* The bar uses dropdowns to stay one line; the sheet uses chips,
            which show every choice at once and are easier to hit. Both are
            bound to the same state. */}
        <div className="hs-field hs-bar-only">
          <FilterSelect id="hero-type" label={t("houses.type")} value={type} onChange={setType}
                        placeholder={t("houses.anyType")}
                        options={TYPES.map((o) => ({ value: o.value, label: t(o.key) }))} />
        </div>
        <div className="hs-field hs-bar-only">
          <FilterSelect id="hero-period" label={t("houses.period")} value={period} onChange={choosePeriod}
                        placeholder={t("houses.anyPeriod")}
                        options={PERIODS.map((o) => ({ value: o.value, label: t(o.key) }))} />
        </div>

        <fieldset className="hs-field hs-sheet-only">
          <legend className="filter-label">{t("houses.type")}</legend>
          {chips("hero-type-chip", TYPES, type, setType, "home.anyType")}
        </fieldset>
        <fieldset className="hs-field hs-sheet-only">
          <legend className="filter-label">{t("houses.period")}</legend>
          {chips("hero-period-chip", PERIODS, period, choosePeriod, "home.anyPeriod")}
        </fieldset>

        <div className="hs-field">
          <FilterSelect id="hero-budget" label={t("home.budgetLabel")} value={budget} onChange={chooseBudget}
                        placeholder={t("home.anyBudget")} options={budgetOptions} />
        </div>
      </div>

      <div className="hs-foot">
        <button type="button" className="btn btn-ghost hs-clear" onClick={clearAll}>
          {t("houses.clearAll")}
        </button>
        <button type="submit" className="btn btn-primary hs-go" aria-live="polite">
          <IconSearch size={17} />
          <span>{cta}</span>
        </button>
      </div>
    </form>
  );

  return (
    <div className="hs-wrap">
      {/* Phones only: one field that opens the sheet. */}
      <button type="button" ref={triggerRef} className="hs-trigger"
              aria-haspopup="dialog" aria-expanded={open}
              onClick={() => setOpen(true)}>
        <IconSearch size={19} />
        <span className={selectedPlace ? "hs-trigger-text has-value" : "hs-trigger-text"}>
          {selectedPlace ? selectedPlace.label : t("home.triggerPrompt")}
        </span>
      </button>

      {/* Open, the sheet is moved to <body>. Inside the hero it would share
          the hero content's stacking layer and slide under the sticky
          navbar, whatever its own z-index. */}
      {open ? createPortal(form, document.body) : form}

      {popular.length > 0 && (
        <nav className="hs-popular" aria-label={t("home.exploreLabel")}>
          <span className="hs-popular-label">{t("home.explore")}</span>
          {popular.map(([city, n]) => (
            <Link key={city} to={`/houses?city=${encodeURIComponent(city)}`} className="hs-popular-chip">
              {t(`city.${city}`, { defaultValue: city })}
              <span className="hs-popular-count">{n}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
