import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDay } from "../utils/date";
import { periodLabel } from "../utils/duration";
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
  const [broken, setBroken] = useState(false);

  const other =
    side === "owner"
      ? { label: "Renter", name: b.renterName, phone: b.renterPhone }
      : { label: "Owner", name: b.ownerName, phone: b.ownerPhone };

  return (
    <article className="booking-card">
      <Link to={`/houses/${b.houseId}`} className="booking-thumb">
        {b.houseImageUrl && !broken ? (
          <img src={imageUrl(b.houseImageUrl)} alt="" onError={() => setBroken(true)} />
        ) : (
          <span>NO PHOTO</span>
        )}
      </Link>

      <div className="booking-body">
        <div className="booking-card-head">
          <Link to={`/houses/${b.houseId}`} className="booking-title">
            {b.houseTitle}
          </Link>
          <span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span>
        </div>

        <p className="booking-sub">
          {b.houseCity} · {periodLabel(b.durationCount, b.durationType)}
        </p>

        <dl className="booking-facts">
          <div>
            <dt>Dates</dt>
            <dd>{formatDay(b.startDate)} — {formatDay(b.lastNight)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd><strong>{b.totalPrice} JOD</strong></dd>
          </div>
          <div>
            <dt>{other.label}</dt>
            <dd>
              {other.name || "—"}
              {other.phone ? (
                <> · <a href={`tel:${other.phone}`}>{other.phone}</a></>
              ) : b.status === "Pending" ? (
                <span className="muted"> · phone shown once confirmed</span>
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
