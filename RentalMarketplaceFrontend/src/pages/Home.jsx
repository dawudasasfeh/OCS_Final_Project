import { useState } from "react";

const PROPERTY_TYPES = ["Apartment", "House", "Villa", "Studio", "Room"];

const FEATURED = [
  { id: 1, city: "Amman", neighborhood: "Abdoun", title: "Bright 3-bedroom apartment with balcony",
    beds: 3, baths: 2, area: 165, price: 550, unit: "month" },
  { id: 2, city: "Irbid", neighborhood: "Al Rahebat Al Wardiah", title: "Furnished studio near Yarmouk University",
    beds: 1, baths: 1, area: 60, price: 180, unit: "month" },
  { id: 3, city: "Aqaba", neighborhood: "Al Sakaneyya", title: "Sea-view villa with private garden",
    beds: 5, baths: 4, area: 320, price: 1400, unit: "month" },
];

export default function Home() {
  const [type, setType] = useState("Apartment");
  const [city, setCity] = useState("");
  const [period, setPeriod] = useState("Monthly");

  function handleSearch(e) {
    e.preventDefault();
    // Wired to the API once the listings endpoint exists.
    console.log({ type, city, period });
  }

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="hero-eyebrow">Rent · Live · Belong</p>
          <h1>Find your next home in Jordan</h1>
          <p className="hero-sub">
            Apartments, villas and studios across the Kingdom — booked by the week,
            the month or the year.
          </p>
        </div>
      </section>

      <div className="container">
        <form className="search-card" onSubmit={handleSearch}>
          <div className="search-types">
            {PROPERTY_TYPES.map((t) => (
              <label key={t} className={t === type ? "type-chip selected" : "type-chip"}>
                <input
                  type="radio"
                  name="propertyType"
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
              placeholder="City or neighbourhood"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <select
              className="input"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
            <button type="submit" className="btn btn-primary">Search</button>
          </div>
        </form>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Featured properties</h2>
            <p className="muted">A few of the homes currently available.</p>
          </div>

          <div className="grid-houses">
            {FEATURED.map((h) => (
              <article key={h.id} className="house-card">
                <div className="house-thumb">Photo</div>
                <div className="house-body">
                  <p className="house-city">{h.city} · {h.neighborhood}</p>
                  <h3 className="house-title">{h.title}</h3>
                  <div className="house-meta">
                    <span>{h.beds} beds</span>
                    <span>{h.baths} baths</span>
                    <span>{h.area} m²</span>
                  </div>
                  <p className="house-price">
                    {h.price} JOD <span>/ {h.unit}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}