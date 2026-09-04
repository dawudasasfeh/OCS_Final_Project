import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getHouse } from "../api/houses";
import { getErrorMessage } from "../api/errors";
import { useAuth } from "../context/AuthContext";

const initials = (name = "") =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const spaced = (s = "") => s.replace(/([a-z])([A-Z])/g, "$1 $2");

const reference = (id) => `BYT${String(id).padStart(6, "0")}`;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function HouseDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [phoneShown, setPhoneShown] = useState(false);
  const [broken, setBroken] = useState(() => new Set());

  const markBroken = (i) => setBroken((prev) => new Set(prev).add(i));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getHouse(id);
        if (!cancelled) {
          setHouse(data);
          setActiveImage(0);
          setPhoneShown(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.status === 404
              ? "This property is not available."
              : getErrorMessage(err, "Could not load this property.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="container section">
        <p className="muted">Loading property…</p>
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="container section">
        <div className="empty-state">
          <p>{error || "Property not found."}</p>
          <Link to="/houses" className="btn btn-outline">Back to properties</Link>
        </div>
      </div>
    );
  }

  const images = house.imageUrls ?? [];
  const isOwner = user?.id === house.ownerId;
  const maskedPhone = house.ownerPhone
    ? `${house.ownerPhone.slice(0, -3)}XXX`
    : "Not provided";

  // Ordered building-level first, then the property, then room counts —
  // the convention Jordanian listing sites use.
  // Optional fields are filtered out rather than shown as "—".
  const details = [
    ["Building age", house.buildingAge ? spaced(house.buildingAge) : null],
    ["Rental period", house.priceUnit],
    ["Property type", spaced(house.propertyType)],
    ["Floor", house.floorNumber],
    ["Apartments in building", house.apartmentsInBuilding],
    ["Furnishing", house.isFurnished ? "Furnished" : "Unfurnished"],
    ["Area", `${house.areaSqM} m²`],
    ["Bedrooms", house.bedrooms],
    ["Master bedrooms", house.masterBedrooms],
    ["Bathrooms", house.bathrooms],
    ["Turnover between stays", `${house.turnoverDays} day${house.turnoverDays === 1 ? "" : "s"}`],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  const listingInfo = [
    ["Reference", reference(house.id)],
    ["Listed on", formatDate(house.createdAt)],
    ["Location", `${house.neighborhood ? house.neighborhood + ", " : ""}${house.city}`],
  ];

  return (
    <>
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="sep">›</span>
          <Link to="/houses">Properties</Link>
          <span className="sep">›</span>
          <Link to={`/houses?city=${encodeURIComponent(house.city)}`}>{house.city}</Link>
          <span className="sep">›</span>
          <span className="current">{house.title}</span>
        </nav>

        <div className="gallery">
          <div className="gallery-thumbs">
            {images.length === 0 && <div className="gallery-thumb">NO IMAGE</div>}
            {images.map((url, i) => (
              <button
                key={url + i}
                type="button"
                className={i === activeImage ? "gallery-thumb active" : "gallery-thumb"}
                onClick={() => setActiveImage(i)}
                aria-label={`Show image ${i + 1}`}
              >
                {broken.has(i)
                  ? <span>{i + 1}</span>
                  : <img src={url} alt="" onError={() => markBroken(i)} />}
              </button>
            ))}
          </div>

          <div className="gallery-main">
            {images.length === 0 || broken.has(activeImage) ? (
              "PHOTO NOT AVAILABLE"
            ) : (
              <img src={images[activeImage]} alt={house.title}
                   onError={() => markBroken(activeImage)} />
            )}
          </div>
        </div>
      </div>

      <div className="container section" style={{ paddingTop: 0 }}>
        <div className="detail-layout">

          <div>
            {house.status !== "Approved" && (
              <p className={house.status === "Rejected" ? "error-text" : "notice"}>
                This listing is <strong>{house.status}</strong>. Only you and an
                administrator can see it.
              </p>
            )}

            <h1 className="detail-title">{house.title}</h1>
            <p className="detail-location">
              {house.address}
              {house.neighborhood ? `, ${house.neighborhood}` : ""}, {house.city}
            </p>

            <div className="spec-bar">
              <div className="spec">
                <span className="spec-label">Bedrooms</span>
                <span className="spec-value">{house.bedrooms}</span>
              </div>
              <div className="spec">
                <span className="spec-label">Bathrooms</span>
                <span className="spec-value">{house.bathrooms}</span>
              </div>
              <div className="spec">
                <span className="spec-label">Area</span>
                <span className="spec-value">{house.areaSqM} m²</span>
              </div>
              <div className="spec">
                <span className="spec-label">Furnishing</span>
                <span className="spec-value">{house.isFurnished ? "Furnished" : "Unfurnished"}</span>
              </div>
              <div className="spec">
                <span className="spec-label">Type</span>
                <span className="spec-value">{spaced(house.propertyType)}</span>
              </div>
            </div>

            <div className="detail-block">
              <h2>Details</h2>
              <dl className="detail-table">
                {details.map(([label, value]) => (
                  <div className="detail-row" key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="detail-block">
              <h2>Description</h2>
              <p className="detail-description">{house.description}</p>
            </div>

            <div className="detail-block">
              <h2>Listing information</h2>
              <dl className="detail-table detail-table-meta">
                {listingInfo.map(([label, value]) => (
                  <div className="detail-row" key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <aside className="detail-aside">
            <div className="price-card">
              <div className="price-tag">
                {house.price} JOD <span>/ {house.priceUnit.toLowerCase()}</span>
              </div>
              <p className="price-note">
                {house.isAvailable ? "Available to book" : "Currently unavailable"}
              </p>

              {isOwner ? (
                <Link to="/my-listings" className="btn btn-outline" style={{ width: "100%" }}>
                  Manage this listing
                </Link>
              ) : (
                <button className="btn btn-primary" style={{ width: "100%" }} disabled>
                  Request booking
                </button>
              )}
            </div>

            <div className="owner-card">
              <div className="owner-head">
                <span className="owner-avatar">{initials(house.ownerName)}</span>
                <div>
                  <div className="owner-name">{house.ownerName || "Owner"}</div>
                  <div className="owner-role">Property owner</div>
                </div>
              </div>

              {phoneShown ? (
                <a href={`tel:${house.ownerPhone}`} className="btn btn-primary phone-btn">
                  {house.ownerPhone}
                </a>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline phone-btn"
                  onClick={() => setPhoneShown(true)}
                  disabled={!house.ownerPhone}
                >
                  {maskedPhone} · Show
                </button>
              )}
            </div>

            <div className="tips-card">
              <h3>Before you rent</h3>
              <ul>
                <li>Visit the property in person before paying anything.</li>
                <li>Do not transfer money before seeing the place.</li>
                <li>Agree the dates and the total in writing.</li>
                <li>Deposits are arranged directly with the owner.</li>
              </ul>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}
