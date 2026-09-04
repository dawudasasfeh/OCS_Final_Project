import { Link } from "react-router-dom";

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
              <li><Link to="/houses">Apartments</Link></li>
              <li><Link to="/houses">Villas</Link></li>
              <li><Link to="/houses">Studios</Link></li>
            </ul>
          </div>

          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/contact">Contact us</Link></li>
              <li><Link to="/my-listings">List a property</Link></li>
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
          <span>Amman · Irbid · Zarqa · Aqaba</span>
        </div>
      </div>
    </footer>
  );
}
