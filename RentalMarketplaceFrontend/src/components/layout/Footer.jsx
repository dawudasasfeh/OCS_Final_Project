import { Link } from "react-router-dom";
import ListPropertyLink from "../ListPropertyLink";
import Logo from "../Logo";
import { useTranslation } from "react-i18next";

// The values are Domain/Enums/PropertyType.cs, the same integers the filter
// panel posts. Linking to /houses with no query gave four "Explore" links that
// all did exactly the same thing.
const TYPES = [
  { key: "propertyType.apartments", query: "propertyType=1" },
  { key: "propertyType.houses", query: "propertyType=2" },
  { key: "propertyType.villas", query: "propertyType=3" },
  { key: "propertyType.studios", query: "propertyType=4" },
];

// Only cities that actually have a visible listing. This line used to name
// Zarqa, which has never had one, and Irbid, whose only listing is pending and
// therefore invisible — both would have linked to an empty results page.
const CITIES = ["Amman", "Aqaba", "Jerash"];

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          <div>
            <div className="footer-brand" style={{ marginBottom: "1.2rem" }}>
              <Logo size={100} variant="full" />
            </div>
            <p style={{ margin: 0, maxWidth: 290 }}>
              {t("footer.blurb")}
            </p>
          </div>

          <div>
            <h4>{t("footer.explore")}</h4>
            <ul>
              <li><Link to="/houses">{t("footer.allProperties")}</Link></li>
              {TYPES.map((type) => (
                <li key={type.query}>
                  <Link to={`/houses?${type.query}`}>{t(type.key)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>{t("footer.company")}</h4>
            <ul>
              <li><Link to="/about">{t("footer.aboutUs")}</Link></li>
              <li><Link to="/contact">{t("footer.contactUs")}</Link></li>
              {/* Was a bare link to /my-listings, which bounced a signed-out
                  visitor to login with no explanation. This is the same
                  component the navbar uses, so the refusal is consistent. */}
              <li><ListPropertyLink /></li>
            </ul>
          </div>

          <div>
            <h4>{t("footer.account")}</h4>
            <ul>
              <li><Link to="/login">{t("nav.login")}</Link></li>
              <li><Link to="/register">{t("footer.createAccount")}</Link></li>
              <li><Link to="/my-bookings">{t("nav.myBookings")}</Link></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span className="footer-cities">
            {CITIES.map((c) => (
              <Link key={c} to={`/houses?city=${encodeURIComponent(c)}`}>{t(`city.${c}`)}</Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
