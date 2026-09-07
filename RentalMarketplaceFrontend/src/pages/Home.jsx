import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchHouses } from "../api/houses";
import { getApprovedTestimonials } from "../api/testimonials";
import { formatDay } from "../utils/date";
import HouseCard from "../components/HouseCard";
import heroImg from "../assets/hero-amman.jpg";

// Labels shown to the user, paired with the enum integers the API filters on.
const PROPERTY_TYPES = [
  { value: "1", label: "Apartment" },
  { value: "2", label: "House" },
  { value: "3", label: "Villa" },
  { value: "4", label: "Studio" },
];

const DURATIONS = [
  { value: "1", label: "Weekly" },
  { value: "2", label: "Monthly" },
  { value: "3", label: "Yearly" },
];

const initials = (name) => name.split(" ").map((w) => w[0]).join("").slice(0, 2);

export default function Home() {
  const [duration, setDuration] = useState("2");
  const [type, setType] = useState("1");
  const [city, setCity] = useState("");
  const [latest, setLatest] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const navigate = useNavigate();

  // searchHouses only ever returns approved, available listings, so every card
  // here is guaranteed to open. A failure leaves the section empty rather than
  // breaking the page — the home page is not the place to report an outage.
  useEffect(() => {
    let cancelled = false;

    searchHouses()
      .then((data) => { if (!cancelled) setLatest(data.slice(0, 4)); })
      .catch(() => { if (!cancelled) setLatest([]); });

    getApprovedTestimonials()
      .then((data) => { if (!cancelled) setTestimonials(data.slice(0, 3)); })
      .catch(() => { if (!cancelled) setTestimonials([]); });

    return () => { cancelled = true; };
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams({ propertyType: type, priceUnit: duration });
    if (city.trim()) params.set("city", city.trim());
    navigate(`/houses?${params}`);
  }

  return (
    <>
      {/* 1 ── Title and search ─────────────────────────────────── */}
      <section className="hero" style={{ "--hero-img": `url(${heroImg})` }}>
        <div className="container">
          <h1>Homes for rent across Jordan</h1>

          <div className="search-tabs">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                className={d.value === duration ? "search-tab active" : "search-tab"}
                onClick={() => setDuration(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <form className="search-card" onSubmit={handleSearch}>
            <div className="search-types">
              {PROPERTY_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={t.value === type ? "type-chip selected" : "type-chip"}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t.value}
                    checked={t.value === type}
                    onChange={(e) => setType(e.target.value)}
                  />
                  {t.label}
                </label>
              ))}
            </div>

            <div className="search-row">
              <input
                className="input"
                placeholder="Type the city or neighbourhood"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">Find</button>
            </div>
          </form>
        </div>
      </section>

      {/* 2 ── Latest listings ──────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Latest listings</h2>
            <p className="muted">The most recently published properties.</p>
          </div>

          {latest.length === 0 ? (
            <p className="muted">No properties published yet.</p>
          ) : (
            <div className="grid-houses">
              {latest.map((h) => <HouseCard key={h.id} house={h} />)}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "1.75rem" }}>
            <Link to="/houses" className="btn btn-outline">Browse all properties</Link>
          </div>
        </div>
      </section>

      {/* 3 ── Testimonials ─────────────────────────────────────── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>What people say</h2>
            <p className="muted">Feedback from renters and owners using Beytak.</p>
          </div>

          {testimonials.length === 0 && (
            <p className="muted">
              No testimonials yet. <Link to="/contact">Share yours</Link>.
            </p>
          )}

          <div className="grid-testimonials">
            {testimonials.map((t) => (
              <article className="testimonial-card" key={t.id}>
                <div className="testimonial-mark">&ldquo;</div>
                <p className="testimonial-text">{t.content}</p>
                <div className="testimonial-author">
                  <span className="testimonial-avatar">{initials(t.userName)}</span>
                  <span>
                    <span className="testimonial-name">{t.userName}</span><br />
                    <span className="testimonial-meta">
                      {formatDay(t.createdAt.slice(0, 10))}
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
