import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyHouses, setHouseAvailability } from "../api/houses";
import { getErrorMessage } from "../api/errors";
import { useTranslation } from "react-i18next";
import { formatDay } from "../utils/date";
import { imageUrl } from "../utils/images";
import ListPropertyLink from "../components/ListPropertyLink";
import Pagination, { usePaged } from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { IconBeds, IconBaths, IconArea } from "../components/icons";

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

        {/* City and property type were printed raw here, so an Arabic reader
            saw "Amman · Studio" in Latin on an otherwise Arabic page. Every
            other card on the site already looks these up; this one was
            missed. The neighbourhood is still free text in the database, so
            it stays in whatever language the owner typed. */}
        <p className="booking-sub" dir="auto">
          {h.neighborhood ? <>{t(`neighborhood.${h.neighborhood}`, { defaultValue: h.neighborhood })}, </> : ""}
          {t(`city.${h.city}`, { defaultValue: h.city })} ·{" "}
          {t(`propertyType.${h.propertyType.charAt(0).toLowerCase()}${h.propertyType.slice(1)}`, { defaultValue: spaced(h.propertyType) })}
        </p>

        {/* A rejection is the one thing on this card the owner has to act on,
            so it sits under the badge that announced it rather than below the
            facts where it used to. */}
        {note && <p className="listing-note">{note}</p>}

        {/* The three facts used to be a dl of equal columns, which gave the
            publication date the same weight as the price. An owner scanning
            this page is looking for the price and the status; the date is the
            last thing they need. */}
        <div className="listing-figures">
          <p className="listing-price">
            {h.price} {t("common.jod")}{" "}
            <span>{t("card.perUnit", { unit: t(`period.${h.priceUnit.toLowerCase()}`, { defaultValue: h.priceUnit.toLowerCase() }) })}</span>
          </p>
          <div className="house-meta listing-specs">
            <span><IconBeds size={15} />{t("common.beds", { count: h.bedrooms })}</span>
            <span><IconBaths size={15} />{t("common.baths", { count: h.bathrooms })}</span>
            <span><IconArea size={15} />{t("common.sqm", { value: h.areaSqM })}</span>
          </div>
        </div>

        <p className="listing-listed">
          {t("myListings.listedOn", { date: formatDay(h.createdAt.slice(0, 10)) })}
        </p>

        <div className="booking-actions">
          <Link to={`/houses/${h.id}/edit`} className="btn btn-primary">{t("listing.edit")}</Link>
          <Link to={`/houses/${h.id}`} className="btn btn-outline">{t("myListings.viewListing")}</Link>
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

  // Counted from every listing, not the page. "3 of 9 live" has to mean
  // nine listings, or the owner of a page-two listing is told it does not
  // exist.
  const paged = usePaged(houses, 6);

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
          {paged.items.map((h) => (
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

      <Pagination
        page={paged.page}
        totalPages={paged.totalPages}
        onChange={paged.setPage}
        label={t("myListings.title")}
      />
    </div>
  );
}
