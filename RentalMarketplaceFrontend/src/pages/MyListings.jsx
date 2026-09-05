import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyHouses } from "../api/houses";
import { getErrorMessage } from "../api/errors";
import { formatDay } from "../utils/date";

const spaced = (s = "") => s.replace(/([a-z])([A-Z])/g, "$1 $2");

const STATUS_NOTE = {
  Pending: "Waiting for an administrator to review it. Only you can see it for now.",
  Rejected: "An administrator rejected this listing. It is not visible to renters.",
};

function ListingCard({ house: h }) {
  const [broken, setBroken] = useState(false);
  const image = h.imageUrls?.[0];
  const note = STATUS_NOTE[h.status];

  return (
    <article className="listing-card">
      <Link to={`/houses/${h.id}`} className="booking-thumb">
        {image && !broken ? (
          <img src={image} alt="" onError={() => setBroken(true)} />
        ) : (
          <span>NO PHOTO</span>
        )}
      </Link>

      <div className="booking-body">
        <div className="booking-card-head">
          <Link to={`/houses/${h.id}`} className="booking-title">{h.title}</Link>
          <span className={`badge badge-${h.status.toLowerCase()}`}>{h.status}</span>
        </div>

        <p className="booking-sub">
          {h.neighborhood ? `${h.neighborhood}, ` : ""}{h.city} · {spaced(h.propertyType)}
        </p>

        <dl className="booking-facts">
          <div>
            <dt>Price</dt>
            <dd><strong>{h.price} JOD</strong> / {h.priceUnit.toLowerCase()}</dd>
          </div>
          <div>
            <dt>Property</dt>
            <dd>{h.bedrooms} bed · {h.bathrooms} bath · {h.areaSqM} m²</dd>
          </div>
          <div>
            <dt>Listed</dt>
            <dd>{formatDay(h.createdAt.slice(0, 10))}</dd>
          </div>
        </dl>

        {note && <p className="listing-note">{note}</p>}

        <div className="booking-actions">
          <Link to={`/houses/${h.id}`} className="btn btn-outline">View listing</Link>
        </div>
      </div>
    </article>
  );
}

export default function MyListings() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getMyHouses();
        if (!cancelled) setHouses(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Could not load your listings."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const live = houses.filter((h) => h.status === "Approved").length;

  return (
    <div className="container section">
      <div className="page-head">
        <div>
          <h1 className="page-title">My listings</h1>
          <p className="muted page-sub">
            {houses.length === 0
              ? "Properties you have listed on Beytak."
              : `${houses.length} propert${houses.length === 1 ? "y" : "ies"}, ${live} visible to renters.`}
          </p>
        </div>
        <Link to="/houses/new" className="btn btn-primary">List a property</Link>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted">Loading your listings…</p>
      ) : houses.length === 0 ? (
        <div className="empty-state">
          <p>You have not listed a property yet.</p>
          <Link to="/houses/new" className="btn btn-primary">List your first property</Link>
        </div>
      ) : (
        <div className="booking-list">
          {houses.map((h) => <ListingCard key={h.id} house={h} />)}
        </div>
      )}
    </div>
  );
}
