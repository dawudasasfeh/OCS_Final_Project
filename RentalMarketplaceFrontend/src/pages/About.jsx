import { Link } from "react-router-dom";

const STATS = [
  { value: "4", label: "Cities covered" },
  { value: "5", label: "Property types" },
  { value: "3", label: "Rental periods" },
  { value: "0%", label: "Commission on rent" },
];

const STEPS = [
  { n: "1", h: "Search", p: "Filter by city, neighbourhood, property type and rental period." },
  { n: "2", h: "Request", p: "Choose a start date and a duration. We work out the end date and the total." },
  { n: "3", h: "Confirm", p: "The owner reviews the request and confirms it. Payment is settled directly." },
  { n: "4", h: "Move in", p: "Collect the keys. The booking stays on record for both sides." },
];

const VALUES = [
  { h: "One listing, one truth",
    p: "Every property carries the same structured details — area, floor, furnishing, building age — so listings can actually be compared." },
  { h: "No double bookings",
    p: "Availability is enforced by the server, including the turnover days an owner needs between tenants." },
  { h: "The agreed price stays agreed",
    p: "The total is fixed on the booking when it is made. Later changes to a property's price never rewrite it." },
  { h: "Owners stay in control",
    p: "Every booking request is reviewed and confirmed by the owner. Nothing is booked automatically." },
];

export default function About() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>About Beytak</h1>
          <p>
            A rental marketplace built for Jordan — where finding a home, agreeing the
            dates and keeping a record of it all happen in one place.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="prose">
            <h2>Why we built it</h2>
            <p>
              Renting in Jordan happens across classifieds sites, Facebook groups and
              word of mouth. Listings are inconsistent, availability is impossible to
              verify without a phone call, and once a place is agreed there is rarely
              any record of what was actually agreed.
            </p>
            <p>
              <strong>Beytak brings those three things together.</strong> Owners publish
              properties with a consistent set of details. Renters search, compare and
              request specific dates. Both sides keep a record of the booking, its status
              and the price that was agreed.
            </p>

            <h2>One model for every rental</h2>
            <p>
              A stay of one week and a lease of one year are the same thing here: a
              booking with a start date, an end date and a duration. There is no separate
              short-term and long-term system, so a property owner manages everything in
              one place — and a renter searching for a month sees only what is genuinely
              available for that month.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>How it works</h2>
            <p className="muted">Four steps from search to keys.</p>
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

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>At a glance</h2>
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

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>What we care about</h2>
            <p className="muted">The rules the platform actually enforces.</p>
          </div>
          <div className="grid-features">
            {VALUES.map((v) => (
              <div className="feature" key={v.h}>
                <h3>{v.h}</h3>
                <p>{v.p}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link to="/houses" className="btn btn-primary">Browse properties</Link>
          </div>
        </div>
      </section>
    </>
  );
}
