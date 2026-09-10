import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDay } from "../utils/date";
import { periodLabel } from "../utils/duration";
import { useTranslation } from "react-i18next";
import { imageUrl } from "../utils/images";

/**
 * One booking, shown from either side of the deal.
 *
 * side="renter"  → the counterparty is the owner   (My bookings)
 * side="owner"   → the counterparty is the renter  (Booking requests)
 *
 * Action buttons are passed as children so each page owns its own mutations.
 */
export default function BookingCard({ booking: b, side = "renter", children }) {
  const { t } = useTranslation();
  const [broken, setBroken] = useState(false);

  const other =
    side === "owner"
      ? { label: t("bookings.renter"), name: b.renterName, phone: b.renterPhone }
      : { label: t("bookings.owner"), name: b.ownerName, phone: b.ownerPhone };

  return (
    <article className="booking-card">
      <Link to={`/houses/${b.houseId}`} className="booking-thumb">
        {b.houseImageUrl && !broken ? (
          <img src={imageUrl(b.houseImageUrl)} alt="" onError={() => setBroken(true)} />
        ) : (
          <span>{t("card.noPhoto")}</span>
        )}
      </Link>

      <div className="booking-body">
        <div className="booking-card-head">
          <Link to={`/houses/${b.houseId}`} className="booking-title" dir="auto">
            {b.houseTitle}
          </Link>
          {/* The raw status drives the badge colour, so it stays in the class name;
              only the visible text is translated. */}
          <span className={`badge badge-${b.status.toLowerCase()}`}>
            {t(`status.${b.status.toLowerCase()}`, { defaultValue: b.status })}
          </span>
        </div>

        <p className="booking-sub">
          {t(`city.${b.houseCity}`, { defaultValue: b.houseCity })} · {periodLabel(t, b.durationCount, b.durationType)}
        </p>

        <dl className="booking-facts">
          <div>
            <dt>{t("bookings.dates")}</dt>
            <dd>{formatDay(b.startDate)} — {formatDay(b.lastNight)}</dd>
          </div>
          <div>
            <dt>{t("bookings.total")}</dt>
            <dd><strong>{b.totalPrice} {t("common.jod")}</strong></dd>
          </div>
          <div>
            <dt>{other.label}</dt>
            <dd>
              {other.name || "—"}
              {other.phone ? (
                <> · <a href={`tel:${other.phone}`}>{other.phone}</a></>
              ) : b.status === "Pending" ? (
                <span className="muted"> · {t("bookings.phoneOnceConfirmed")}</span>
              ) : null}
            </dd>
          </div>
        </dl>

        {/* Rendered bare rather than wrapped in .booking-actions: a page may
            pass buttons, a payments block, or both, and only the buttons want
            to sit in a row. */}
        {children}
      </div>
    </article>
  );
}
