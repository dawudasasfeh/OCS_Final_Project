import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchHouses, getCityCounts } from "../api/houses";
import { getApprovedTestimonials } from "../api/testimonials";
import { formatDay } from "../utils/date";
import HouseCard from "../components/HouseCard";
import Autocomplete from "../components/Autocomplete";
import { cityOptions } from "../utils/cities";
import heroImg from "../assets/hero-amman.jpg";
import { useTranslation } from "react-i18next";

// Labels shown to the user, paired with the enum integers the API filters on.
const PROPERTY_TYPES = [
  { value: "1", key: "propertyType.apartment" },
  { value: "2", key: "propertyType.house" },
  { value: "3", key: "propertyType.villa" },
  { value: "4", key: "propertyType.studio" },
];

const DURATIONS = [
  { value: "1", key: "period.weekly" },
  { value: "2", key: "period.monthly" },
  { value: "3", key: "period.yearly" },
];

// Four cards on screen, three batches behind them. Twelve is the most the home
// page can hold without the request becoming its own reason to wait.
// Three seconds a batch, so the whole set has been past the reader inside ten.
const PER_BATCH = 4;
const BATCHES = 3;
const ROTATE_MS = 3000;

const initials = (name) => name.split(" ").map((w) => w[0]).join("").slice(0, 2);

const chunk = (list, size) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) =>
    list.slice(i * size, i * size + size));

export default function Home() {
  const [duration, setDuration] = useState("2");
  const [type, setType] = useState("1");
  const [city, setCity] = useState("");
  const [latest, setLatest] = useState([]);
  const [cityCounts, setCityCounts] = useState({});
  const [testimonials, setTestimonials] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // searchHouses only ever returns approved, available listings, so every card
  // here is guaranteed to open. A failure leaves the section empty rather than
  // breaking the page — the home page is not the place to report an outage.
  useEffect(() => {
    let cancelled = false;

    searchHouses({ pageSize: PER_BATCH * BATCHES })
      .then((data) => { if (!cancelled) setLatest(data.items ?? []); })
      .catch(() => { if (!cancelled) setLatest([]); });

    // A separate call now that the search is paged: counting cities from the
    // twelve listings on screen would report twelve listings' worth of cities.
    getCityCounts()
      .then((counts) => { if (!cancelled) setCityCounts(counts); })
      .catch(() => {});

    getApprovedTestimonials()
      .then((data) => { if (!cancelled) setTestimonials(data.slice(0, 3)); })
      .catch(() => { if (!cancelled) setTestimonials([]); });

    return () => { cancelled = true; };
  }, []);

  // ── The rotating batch ────────────────────────────────────────────
  const batches = useMemo(() => chunk(latest, PER_BATCH), [latest]);
  const [batch, setBatch] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [taken, setTaken] = useState(false);   // reader picked a batch by hand
  const [hidden, setHidden] = useState(false);

  // Someone with vestibular sensitivity has asked the operating system not to
  // move things at them. Four property cards sliding past every three seconds
  // is exactly that, so the rotation simply does not start — the dots
  // still work, and nothing else about the section changes.
  const [still, setStill] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // A background tab should not be cycling. Browsers throttle the timer rather
  // than stop it, so without this the reader returns to a section that has
  // silently moved on while they were elsewhere.
  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const paused = hovering || taken || hidden || still;

  useEffect(() => {
    if (paused || batches.length <= 1) return;
    const id = setInterval(
      () => setBatch((b) => (b + 1) % batches.length),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, [paused, batches.length]);

  // The list can shrink under the index — a listing delisted between two
  // visits is enough — and an index past the end renders nothing at all.
  useEffect(() => {
    if (batch >= batches.length) setBatch(0);
  }, [batch, batches.length]);

  // Focus is a pause too, not just the pointer: someone tabbing through the
  // cards must not have the card under their cursor swapped mid-reach.
  const holdRef = useRef(null);

  function show(i) {
    setBatch(i);
    // Choosing a batch ends the rotation for this visit. Being moved off the
    // thing you just asked to see, three seconds later, is worse than a section
    // that has stopped.
    setTaken(true);
  }

  const shown = batches[batch] ?? [];

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams({ propertyType: type, priceUnit: duration });
    if (city) params.set("city", city);
    navigate(`/houses?${params}`);
  }

  return (
    <>
      {/* 1 ── Title and search ─────────────────────────────────── */}
      <section className="hero" style={{ "--hero-img": `url(${heroImg})` }}>
        <div className="container">
          <h1>{t("home.heroTitle")}</h1>

          <div className="search-tabs">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                className={d.value === duration ? "search-tab active" : "search-tab"}
                onClick={() => setDuration(d.value)}
              >
                {t(d.key)}
              </button>
            ))}
          </div>

          <form className="search-card" onSubmit={handleSearch}>
            <div className="search-types">
              {PROPERTY_TYPES.map((pt) => (
                <label
                  key={pt.value}
                  className={pt.value === type ? "type-chip selected" : "type-chip"}
                >
                  <input
                    type="radio"
                    name="type"
                    value={pt.value}
                    checked={pt.value === type}
                    onChange={(e) => setType(e.target.value)}
                  />
                  {t(pt.key)}
                </label>
              ))}
            </div>

            {/* The placeholder used to offer "city or neighbourhood", but
                handleSearch only ever sent city — the form has never searched
                neighbourhoods. Still a text box, so typing works as before, but
                the suggestions mean "Ammann" no longer quietly returns nothing:
                only a real city is ever committed to the search. */}
            <div className="search-row">
              <Autocomplete
                id="hero-city"
                label={t("houses.city")}
                placeholder={t("home.searchPlaceholder")}
                options={cityOptions(t, cityCounts)}
                value={city}
                onChange={setCity}
              />
              <button className="btn btn-primary" type="submit">{t("common.find")}</button>
            </div>
          </form>
        </div>
      </section>

      {/* 2 ── Latest listings, four at a time ──────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("home.latestTitle")}</h2>
            <p className="muted">{t("home.latestSub")}</p>
          </div>

          {latest.length === 0 ? (
            <p className="muted">{t("home.noneYet")}</p>
          ) : (
            <div
              className="rotator"
              ref={holdRef}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              onFocusCapture={() => setHovering(true)}
              onBlurCapture={(e) => {
                if (!holdRef.current?.contains(e.relatedTarget)) setHovering(false);
              }}
            >
              {/* Keyed on the batch so React replaces the cards rather than
                  patching them, which is what lets the fade run at all. */}
              <div className="grid-houses rotator-slide" key={batch}>
                {shown.map((h) => <HouseCard key={h.id} house={h} />)}
              </div>

              {batches.length > 1 && (
                <div className="rotator-dots" role="tablist" aria-label={t("home.latestTitle")}>
                  {batches.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === batch}
                      className={i === batch ? "rotator-dot active" : "rotator-dot"}
                      onClick={() => show(i)}
                      aria-label={t("home.showBatch", { n: i + 1, total: batches.length })}
                    >
                      <span className="rotator-dot-fill" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="rotator-more">
            <Link to="/houses" className="btn btn-outline">{t("home.browseAll")}</Link>
          </div>
        </div>
      </section>

      {/* 3 ── Testimonials ─────────────────────────────────────── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head section-head-row">
            <div>
              <h2>{t("home.testimonialsTitle")}</h2>
              <p className="muted">{t("home.testimonialsSub")}</p>
            </div>
            <Link to="/contact" className="btn btn-outline">
              {t("home.addTestimonial")}
            </Link>
          </div>

          {testimonials.length === 0 && (
            <p className="muted">{t("home.noTestimonials")}</p>
          )}

          <div className="grid-testimonials">
            {/* Named item, not t — t is the translation function now, and a map
                parameter called t would shadow it inside this block. */}
            {testimonials.map((item) => (
              <article className="testimonial-card" key={item.id}>
                <div className="testimonial-mark">&ldquo;</div>
                <p className="testimonial-text" dir="auto">{item.content}</p>
                <div className="testimonial-author">
                  <span className="testimonial-avatar">{initials(item.userName)}</span>
                  <span>
                    <span className="testimonial-name">{item.userName}</span><br />
                    <span className="testimonial-meta">
                      {formatDay(item.createdAt.slice(0, 10))}
                    </span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4 ── Footer lives in Layout.jsx ───────────────────────── */}
    </>
  );
}
