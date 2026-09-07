import { Link } from "react-router-dom";

const STATS = [
  { value: "4", label: "Jordanian regions" },
  { value: "0%", label: "Commission on rent" },
  { value: "3", label: "Flexible rental periods" },
  { value: "100%", label: "Direct owner contact" },
];

const JORDAN_REGIONS = [
  {
    city: "Amman",
    tag: "Capital & Urban Living",
    img: "/about/amman-apartments.jpg",
    desc: "From modern apartments in Abdoun, Dabouq, and Jubaiha to artistic studios in Jabal Al Weibdeh and 7th Circle.",
    link: "/houses?city=Amman",
  },
  {
    city: "As-Salt & Jerash",
    tag: "Heritage & Hills",
    img: "/about/salt-heritage.jpg",
    desc: "Characterful yellow stone houses, panoramic hillside terraces, and peaceful countryside village living.",
    link: "/houses?city=Salt",
  },
  {
    city: "Aqaba & The Red Sea",
    tag: "Coastal Living",
    img: "/about/aqaba-coastal.jpg",
    desc: "Sunny seaside apartments, marina chalets, and vacation homes along Jordan's southern Red Sea coast.",
    link: "/houses?city=Aqaba",
  },
];

const STEPS = [
  {
    n: "1",
    h: "Search Jordan with Confidence",
    p: "Filter by city, neighborhood, furnishing, bedrooms, and lease period without wading through unverified social media posts.",
  },
  {
    n: "2",
    h: "Request Available Dates",
    p: "Pick your start date and stay duration. Our availability engine calculates exact checkout dates and protects turnover cleaning gaps.",
  },
  {
    n: "3",
    h: "Direct Owner Confirmation",
    p: "The property owner reviews your request. Once confirmed, you receive verified direct contact details via phone or WhatsApp.",
  },
  {
    n: "4",
    h: "Move In & Pay Directly",
    p: "Inspect the property, collect your keys, and settle rent directly via Cash, CliQ, or Bank Transfer — with zero commission.",
  },
];

const VALUES = [
  {
    icon: "⚖",
    h: "One standard, full transparency",
    p: "Every property in Jordan carries structured specs — area in m², floor number, building age, and furnishing — making listings truly comparable.",
  },
  {
    icon: "🛡",
    h: "Zero double-bookings",
    p: "Server-side availability tracking enforces real-time booking locks, automatically guarding turnover cleaning days between stays.",
  },
  {
    icon: "🏷",
    h: "Agreed prices stay agreed",
    p: "Your total price snapshot is locked the moment a request is created. Subsequent price changes by an owner never alter existing bookings.",
  },
  {
    icon: "🤝",
    h: "Direct relationships, 0% fees",
    p: "Beytak charges tenants zero commission. We empower Jordanian owners and renters to communicate directly without broker markups.",
  },
];

export default function About() {
  return (
    <>
      {/* 1 ── Header ────────────────────────────────────────────── */}
      <section className="page-head">
        <div className="container">
          <h1>About Beytak · بيتك</h1>
          <p>
            A rental marketplace built specifically for Jordan — where finding a home,
            transparent pricing, and direct relationships come together.
          </p>
        </div>
      </section>

      {/* 2 ── Story & Mission (Image Split) ──────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="about-hero-grid">
            <div>
              <span className="badge badge-approved" style={{ marginBottom: ".8rem" }}>
                Our Mission in Jordan
              </span>
              <h2>Renting in Jordan, Reimagined</h2>
              <p className="muted">
                For years, finding a home in Jordan has meant scrolling endlessly
                through disorganized Facebook groups, deciphering vague classified ads,
                paying hefty broker commissions, and relying on informal verbal agreements
                that offer zero certainty.
              </p>
              <p className="muted">
                <strong>Beytak (بيتك — "Your Home")</strong> was created to bring order,
                clarity, and transparency to the Jordanian rental market. Whether you are
                renting a furnished studio in Amman for two weeks or leasing a family villa
                in Abdoun for a year, Beytak provides one unified, trusted platform.
              </p>

              <div className="about-pills">
                <span className="about-pill">
                  <span className="dot" /> 0% Broker Fees
                </span>
                <span className="about-pill">
                  <span className="dot" /> Verified Photos
                </span>
                <span className="about-pill">
                  <span className="dot" /> Server-Guaranteed Dates
                </span>
                <span className="about-pill">
                  <span className="dot" /> Cash &amp; CliQ Friendly
                </span>
              </div>

              <Link to="/houses" className="btn btn-primary">
                Explore Available Homes
              </Link>
            </div>

            <div className="about-img-frame">
              <img
                src="/about/amman-living.jpg"
                alt="Modern furnished apartment in Amman overlooking the city"
              />
              <div className="about-img-badge">
                <strong>Contemporary Jordanian Living</strong>
                Curated homes across Amman, As-Salt, Irbid, and Aqaba.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 ── Destinations Across Jordan ────────────────────────── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>Homes Across the Kingdom</h2>
            <p className="muted">
              Explore rentals tailored to Jordan's unique cities and landscapes.
            </p>
          </div>

          <div className="about-cities-grid">
            {JORDAN_REGIONS.map((region) => (
              <article className="city-card" key={region.city}>
                <div className="city-card-thumb">
                  <img src={region.img} alt={`${region.city}, Jordan`} />
                  <span className="city-card-tag">{region.tag}</span>
                </div>
                <div className="city-card-body">
                  <h3>{region.city}</h3>
                  <p>{region.desc}</p>
                  <Link to={region.link} className="city-card-link">
                    Explore properties in {region.city} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4 ── How It Works ──────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>How It Works</h2>
            <p className="muted">Four straightforward steps from search to keys in hand.</p>
          </div>
          <div className="grid-features">
            {STEPS.map((s) => (
              <div className="feature" key={s.n}>
                <div className="feature-num">{s.n}</div>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 ── Stats At A Glance ─────────────────────────────────── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>At a Glance</h2>
            <p className="muted">The numbers behind the platform.</p>
          </div>
          <div className="grid-stats">
            {STATS.map((s) => (
              <div className="stat" key={s.label}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 ── What We Care About (Values) ───────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Our Core Principles</h2>
            <p className="muted">The rules the platform actually enforces for everyone.</p>
          </div>
          <div className="values-grid">
            {VALUES.map((v) => (
              <div className="value-card" key={v.h}>
                <div className="value-icon">{v.icon}</div>
                <h3>{v.h}</h3>
                <p>{v.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 ── Amman Panoramic Banner & Call To Action ──────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="about-banner">
            <h2>Ready to find your next home in Jordan?</h2>
            <p>
              Browse hundreds of apartments, villas, and studios across Amman,
              Irbid, and Aqaba — or list your property today with zero commission.
            </p>
            <div className="about-banner-actions">
              <Link to="/houses" className="btn btn-primary">
                Browse Properties
              </Link>
              <Link to="/my-listings" className="btn btn-outline">
                List a Property
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

