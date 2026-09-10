import { Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPendingHouses, approveHouse, rejectHouse } from "../../api/houses";
import { imageUrl } from "../../utils/images";
import { useQueue, QueueSection } from "./useQueue";

const spaced = (s = "") => s.replace(/([a-z])([A-Z])/g, "$1 $2");

/**
 * Cards, not a table.
 *
 * Approving a listing is a judgement, not a lookup: you need the photograph,
 * the price, the specification and the owner's own description to decide. A
 * table cannot carry a photograph at a useful size, and without one an
 * administrator would be approving blind.
 */
export default function AdminListings() {
  const { t } = useTranslation();
  const { refreshCounts } = useOutletContext();
  const queue = useQueue(getPendingHouses, refreshCounts);

  return (
    <QueueSection queue={queue} empty={t("admin.noListings")}>
      {queue.items.map((h) => (
        <article className="listing-card" key={h.id}>
          <Link to={`/houses/${h.id}`} className="booking-thumb">
            {h.imageUrls?.[0]
              ? <img src={imageUrl(h.imageUrls[0])} alt="" />
              : <span>{t("card.noPhoto")}</span>}
          </Link>

          <div className="booking-body">
            <div className="booking-card-head">
              <Link to={`/houses/${h.id}`} className="booking-title" dir="auto">{h.title}</Link>
              <span className="badge badge-pending">{t("status.pending")}</span>
            </div>

            <p className="booking-sub">
              {h.neighborhood ? `${h.neighborhood}, ` : ""}
              {t(`city.${h.city}`, { defaultValue: h.city })} ·{" "}
              {t(`propertyType.${h.propertyType.charAt(0).toLowerCase()}${h.propertyType.slice(1)}`, { defaultValue: spaced(h.propertyType) })}
            </p>

            <dl className="booking-facts">
              <div><dt>{t("admin.owner")}</dt><dd>{h.ownerName}</dd></div>
              <div>
                <dt>{t("admin.price")}</dt>
                <dd>
                  <strong>{h.price} {t("common.jod")}</strong>{" "}
                  {t("card.perUnit", { unit: t(`period.${h.priceUnit.toLowerCase()}`, { defaultValue: h.priceUnit.toLowerCase() }) })}
                </dd>
              </div>
              <div>
                <dt>{t("admin.property")}</dt>
                <dd>{t("admin.propertySummary", { beds: h.bedrooms, baths: h.bathrooms, area: h.areaSqM })}</dd>
              </div>
            </dl>

            <p className="admin-excerpt" dir="auto">{h.description}</p>

            <div className="booking-actions">
              <button
                type="button" className="btn btn-primary"
                disabled={queue.busyId === h.id}
                onClick={() => queue.decide(h.id, approveHouse, t("admin.couldNotApproveListing"), t("admin.listingApproved"))}
              >
                {t("admin.approve")}
              </button>
              <button
                type="button" className="btn btn-outline"
                disabled={queue.busyId === h.id}
                onClick={() => queue.decide(h.id, rejectHouse, t("admin.couldNotRejectListing"), t("admin.listingRejected"))}
              >
                {t("admin.reject")}
              </button>
            </div>
          </div>
        </article>
      ))}
    </QueueSection>
  );
}
