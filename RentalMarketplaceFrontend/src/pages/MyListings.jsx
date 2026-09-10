import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyHouses, setHouseAvailability } from "../api/houses";
import { getErrorMessage } from "../api/errors";
import { useTranslation } from "react-i18next";
import { formatDay } from "../utils/date";
import { imageUrl } from "../utils/images";
import ListPropertyLink from "../components/ListPropertyLink";
import { useToast } from "../context/ToastContext";

const spaced = (s = "") => s.replace(/([a-z])([A-Z])/g, "$1 $2");

const STATUS_NOTE = {
  Pending: "myListings.pendingNote",
  Rejected: "myListings.rejectedNote",
};

function ListingCard({ house: h, onAvailabilityChange }) {
  const [broken, setBroken] = useState(false);
  const [busy, setBusy] = useState(false);
  const image = h.imageUrls?.[0];
  const { t } = useTranslation();
  const toast = useToast();
  const noteKey = STATUS_NOTE[h.status];
  const note = noteKey ? t(noteKey) : null;

  // FR-2.8. Delisting stops new requests; it deliberately leaves bookings that
  // are already agreed alone, so the message says so rather than letting an
  // owner assume they have cancelled anything.
  async function toggleAvailability() {
    setBusy(true);
    try {
      const updated = await setHouseAvailability(h.id, !h.isAvailable);
      onAvailabilityChange(updated);
      toast.success(updated.isAvailable ? t("myListings.relisted") : t("myListings.delisted"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("myListings.couldNotChange")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="listing-card">
      <Link to={`/houses/${h.id}`} className="booking-thumb">
        {image && !broken ? (
          <img src={imageUrl(image)} alt="" onError={() => setBroken(true)} />
        ) : (
          <span>{t("card.noPhoto")}</span>
        )}
      </Link>

      <div className="booking-body">
        <div className="booking-card-head">
          <Link to={`/houses/${h.id}`} className="booking-title" dir="auto">{h.title}</Link>
          <span className={`badge badge-${h.status.toLowerCase()}`}>
            {t(`status.${h.status.toLowerCase()}`, { defaultValue: h.status })}
          </span>
          {!h.isAvailable && (
            <span className="badge badge-completed">{t("myListings.notAvailable")}</span>
          )}
        </div>

        <p className="booking-sub">
          {h.neighborhood ? `${h.neighborhood}, ` : ""}{h.city} · {spaced(h.propertyType)}
        </p>

        <dl className="booking-facts">
          <div>
            <dt>{t("myListings.price")}</dt>
            <dd><strong>{h.price} JOD</strong> / {h.priceUnit.toLowerCase()}</dd>
          </div>
          <div>
            <dt>{t("myListings.property")}</dt>
            <dd>{t("admin.propertySummary", { beds: h.bedrooms, baths: h.bathrooms, area: h.areaSqM })}</dd>
          </div>
          <div>
            <dt>{t("myListings.listed")}</dt>
            <dd>{formatDay(h.createdAt.slice(0, 10))}</dd>
          </div>
        </dl>

        {note && <p className="listing-note">{note}</p>}

        <div className="booking-actions">
          <Link to={`/houses/${h.id}`} className="btn btn-outline">{t("myListings.viewListing")}</Link>
          <Link to={`/houses/${h.id}/edit`} className="btn btn-outline">{t("listing.edit")}</Link>
          <button type="button" className="btn btn-outline" onClick={toggleAvailability} disabled={busy}>
            {h.isAvailable ? t("myListings.delist") : t("myListings.relist")}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MyListings() {
  const { t } = useTranslation();
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
        if (!cancelled) setError(getErrorMessage(err, t("myListings.couldNotLoad")));
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
      <div className="page-bar">
        <div>
          <h1 className="page-title">{t("myListings.title")}</h1>
          <p className="muted page-sub">
            {houses.length === 0
              ? t("myListings.subtitle")
              : t("myListings.countLine", { count: houses.length, live })}
          </p>
        </div>
        <ListPropertyLink className="btn btn-primary" />
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted">{t("myListings.loading")}</p>
      ) : houses.length === 0 ? (
        <div className="empty-state">
          <p>{t("myListings.empty")}</p>
          <ListPropertyLink className="btn btn-primary">{t("myListings.listFirst")}</ListPropertyLink>
        </div>
      ) : (
        <div className="booking-list">
          {houses.map((h) => (
            <ListingCard
              key={h.id}
              house={h}
              onAvailabilityChange={(updated) =>
                setHouses((list) => list.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
