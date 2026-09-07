import { Link } from "react-router-dom";
import ListPropertyLink from "../ListPropertyLink";

// The values are Domain/Enums/PropertyType.cs, the same integers the filter
// panel posts. Linking to /houses with no query gave four "Explore" links that
// all did exactly the same thing.
const TYPES = [
  { label: "Apartments", query: "propertyType=1" },
  { label: "Houses", query: "propertyType=2" },
  { label: "Villas", query: "propertyType=3" },
  { label: "Studios", query: "propertyType=4" },
];

// Only cities that actually have a visible listing. This line used to name
// Zarqa, which has never had one, and Irbid, whose only listing is pending and
// therefore invisible — both would have linked to an empty results page.
const CITIES = ["Amman", "Aqaba", "Jerash"];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          <div>
            <div className="footer-brand">Beytak <span>بيتك</span></div>
            <p style={{ margin: 0, maxWidth: 290 }}>
              Rent apartments, villas and studios across Jordan — by the week,
              the month or the year.
            </p>
          </div>

          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/houses">All properties</Link></li>
              {TYPES.map((t) => (
                <li key={t.query}>
                  <Link to={`/houses?${t.query}`}>{t.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/contact">Contact us</Link></li>
              {/* Was a bare link to /my-listings, which bounced a signed-out
                  visitor to login with no explanation. This is the same
                  component the navbar uses, so the refusal is consistent. */}
              <li><ListPropertyLink /></li>
            </ul>
          </div>

          <div>
            <h4>Account</h4>
            <ul>
              <li><Link to="/login">Log in</Link></li>
              <li><Link to="/register">Create account</Link></li>
              <li><Link to="/my-bookings">My bookings</Link></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <span>© 2026 Beytak. Orange Coding School final project.</span>
          <span className="footer-cities">
            {CITIES.map((c) => (
              <Link key={c} to={`/houses?city=${encodeURIComponent(c)}`}>{c}</Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
