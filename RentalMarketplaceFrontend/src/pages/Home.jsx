import { useState } from "react";
import { Link } from "react-router-dom";
import heroImg from "../assets/hero-amman.jpg";

const PROPERTY_TYPES = ["Apartment", "House", "Villa", "Studio", "Room"];
const DURATIONS = ["Weekly", "Monthly", "Yearly"];

/* Replaced by GET /api/houses?sort=newest once the listings endpoint exists. */
const LATEST = [
  { id: 1, city: "Amman", area: "Abdoun", title: "Bright 3-bedroom with balcony",
    beds: 3, baths: 2, size: 165, price: 550, unit: "month", tag: "Furnished" },
  { id: 2, city: "Irbid", area: "Al Rahebat Al Wardiah", title: "Studio near Yarmouk University",
    beds: 1, baths: 1, size: 60, price: 180, unit: "month", tag: "New" },
  { id: 3, city: "Aqaba", area: "Al Sakaneyya", title: "Sea-view villa with garden",
    beds: 5, baths: 4, size: 320, price: 1400, unit: "month", tag: "Villa" },
  { id: 4, city: "Amman", area: "Jabal Al Weibdeh", title: "Renovated 2-bedroom in a quiet street",
    beds: 2, baths: 1, size: 110, price: 400, unit: "month", tag: "Furnished" },
];

/* Replaced by GET /api/testimonials (approved only). */
const TESTIMONIALS = [
  { id: 1, name: "Lina Haddad", city: "Amman",
    text: "I found a furnished flat in Weibdeh in two days. Booking the dates and getting the owner to confirm took one afternoon." },
  { id: 2, name: "Omar Zayd", city: "Irbid",
    text: "I list two studios near the university here. Requests arrive with the dates already set, so there is no back and forth over WhatsApp." },
  { id: 3, name: "Sara Nimri", city: "Aqaba",
    text: "Renting for a full year was straightforward. The price I agreed to is the price on the booking, and nothing changed later." },
];

const initials = (name) => name.split(" ").map((w) => w[0]).join("").slice(0, 2);

export default function Home() {
  const [duration, setDuration] = useState("Monthly");
  const [type, setType] = useState("Apartment");
  const [city, setCity] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    console.log({ duration, type, city });
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
                key={d}
                type="button"
                className={d === duration ? "search-tab active" : "search-tab"}
                onClick={() => setDuration(d)}
              >
                {d}
              </button>
            ))}
          </div>

          <form className="search-card" onSubmit={handleSearch}>
            <div className="search-types">
              {PROPERTY_TYPES.map((t) => (
                <label key={t} className={t === type ? "type-chip selected" : "type-chip"}>
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={t === type}
                    onChange={(e) => setType(e.target.value)}
                  />
                  {t}
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

          <div className="grid-houses">
            {LATEST.map((h) => (
              <Link to={`/houses/${h.id}`} key={h.id} className="house-card">
                <div className="house-thumb">
                  <span className="house-tag">{h.tag}</span>
                  Photo
                </div>
                <div className="house-body">
                  <p className="house-city">{h.city} · {h.area}</p>
                  <h3 className="house-title">{h.title}</h3>
                  <div className="house-meta">
                    <span>{h.beds} beds</span>
                    <span>{h.baths} baths</span>
                    <span>{h.size} m²</span>
                  </div>
                  <div className="house-foot">
                    <span className="house-price">{h.price} JOD <span>/ {h.unit}</span></span>
                    <span className="house-link">View details</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

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

          <div className="grid-testimonials">
            {TESTIMONIALS.map((t) => (
              <article className="testimonial-card" key={t.id}>
                <div className="testimonial-mark">&ldquo;</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <span className="testimonial-avatar">{initials(t.name)}</span>
                  <span>
                    <span className="testimonial-name">{t.name}</span><br />
                    <span className="testimonial-meta">{t.city}</span>
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
