import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchHouses } from "../api/houses";
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

const initials = (name) => name.split(" ").map((w) => w[0]).join("").slice(0, 2);

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

    searchHouses()
      .then((data) => {
        if (cancelled) return;
        setLatest(data.slice(0, 4));
        // Counts come off the same response the Latest section already needs,
        // so the suggestions cost no extra request.
        const counts = {};
        for (const h of data) if (h.city) counts[h.city] = (counts[h.city] ?? 0) + 1;
        setCityCounts(counts);
      })
      .catch(() => { if (!cancelled) setLatest([]); });

    getApprovedTestimonials()
      .then((data) => { if (!cancelled) setTestimonials(data.slice(0, 3)); })
      .catch(() => { if (!cancelled) setTestimonials([]); });

    return () => { cancelled = true; };
  }, []);

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

      {/* 2 ── Latest listings ──────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("home.latestTitle")}</h2>
            <p className="muted">{t("home.latestSub")}</p>
          </div>

          {latest.length === 0 ? (
            <p className="muted">{t("home.noneYet")}</p>
          ) : (
            <div className="grid-houses">
              {latest.map((h) => <HouseCard key={h.id} house={h} />)}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "1.75rem" }}>
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
