import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getHouse } from "../api/houses";
import { imageUrl } from "../utils/images";
import { getErrorMessage } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import WishlistButton from "../components/WishlistButton";
import BookingForm from "../components/BookingForm";


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
  const [broken, setBroken] = useState(() => new Set());
  const [booking, setBooking] = useState(false);

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

  // The API decides what this string is: a guest receives 079048XXXX,
  // a signed-in caller receives the whole number. Nothing is masked here.
  const phone = house.ownerPhone;

  // wa.me needs the number in international form with no punctuation: a local
  // 0790000000 becomes 962790000000. Only built for a signed-in caller — a
  // guest holds the masked number, and 079048XXXX would make a dead link.
  const whatsapp = user && phone && /^\d+$/.test(phone)
    ? `https://wa.me/962${phone.replace(/^0/, "")}?text=${encodeURIComponent(
        `Hello, I saw your listing "${house.title}" (ref BYT${String(house.id).padStart(6, "0")}) on Beytak and would like to ask about it.`
      )}`
    : null;

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
                  : <img src={imageUrl(url)} alt="" onError={() => markBroken(i)} />}
              </button>
            ))}
          </div>

          <div className="gallery-main">
            {images.length === 0 || broken.has(activeImage) ? (
              "PHOTO NOT AVAILABLE"
            ) : (
              <img src={imageUrl(images[activeImage])} alt={house.title}
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

            <div className="detail-title-row">
              <h1 className="detail-title">{house.title}</h1>
              <WishlistButton
                houseId={house.id}
                ownerId={house.ownerId}
                className="wish-btn-lg"
              />
            </div>
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
                <Link to="/my-listings" className="btn btn-outline phone-btn">
                  Manage this listing
                </Link>
              ) : (
                <div className="action-stack">
                  {!phone ? (
                    <div className="phone-btn phone-empty">No phone number provided</div>
                  ) : user ? (
                    <a href={`tel:${phone}`} className="btn btn-primary phone-btn">
                      <span className="phone-icon" aria-hidden="true">&#9742;</span>
                      <span className="phone-text">
                        <strong>{phone}</strong>
                      </span>
                    </a>
                  ) : (
                    <Link
                      to={`/login?returnTo=/houses/${house.id}`}
                      className="btn btn-primary phone-btn"
                    >
                      <span className="phone-icon" aria-hidden="true">&#9742;</span>
                      <span className="phone-text">
                        <strong>{phone}</strong>
                        <small>Sign in to see the full number</small>
                      </span>
                    </Link>
                  )}

                  {/* In Jordan most enquiries start on WhatsApp rather than a
                      call, and the prefilled message saves the owner asking
                      which listing this is about. */}
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      className="btn btn-whatsapp phone-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="phone-icon" aria-hidden="true">&#128172;</span>
                      <span className="phone-text"><strong>Chat on WhatsApp</strong></span>
                    </a>
                  )}

                  {user ? (
                      booking ? (
                        <BookingForm key={house.id} house={house} />
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline phone-btn"
                          onClick={() => setBooking(true)}
                          disabled={!house.isAvailable}
                        >
                          Book now
                        </button>
                      )
                    ) : (
                      <Link
                        to={`/login?returnTo=/houses/${house.id}`}
                        className="btn btn-outline phone-btn"
                      >
                        Book now
                      </Link>
                    )}
                </div>
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
