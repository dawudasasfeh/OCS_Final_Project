import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDay } from "../utils/date";
import { periodLabel } from "../utils/duration";
import { useTranslation } from "react-i18next";
import { imageUrl } from "../utils/images";
import { IconCalendar, IconPhone, IconChat } from "./icons";

/**
 * One booking, shown from either side of the deal.
 *
 * side="renter"  → the counterparty is the owner   (My bookings)
 * side="owner"   → the counterparty is the renter  (Booking requests)
 *
 * Action buttons are passed as children so each page owns its own mutations.
 *
 * The three facts used to be a <dl> of equal columns, which said the dates,
 * the money and the other party's name all matter the same amount. They do
 * not: the total is the number an owner checks, and the phone is something
 * they act on rather than read.
 */
export default function BookingCard({ booking: b, side = "renter", children }) {
  const { t } = useTranslation();
  const [broken, setBroken] = useState(false);

  const other =
    side === "owner"
      ? { label: t("bookings.renter"), name: b.renterName, phone: b.renterPhone }
      : { label: t("bookings.owner"), name: b.ownerName, phone: b.ownerPhone };

  // Same rule as the listing page: a local 0790000000 becomes 962790000000,
  // and only a number the API actually released is linkable.
  const whatsapp = other.phone && /^\d+$/.test(other.phone)
    ? `https://wa.me/962${other.phone.replace(/^0/, "")}`
    : null;

  return (
    <article className={b.status === "Pending" ? "booking-card needs-answer" : "booking-card"}>
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

        {/* When and how much — the two things a decision rests on, on one line
            with the money given the weight it earns. */}
        <div className="booking-figures">
          <p className="booking-when">
            <IconCalendar size={15} />
            <span>{formatDay(b.startDate)} — {formatDay(b.lastNight)}</span>
          </p>
          <p className="booking-total">
            {b.totalPrice} {t("common.jod")}
          </p>
        </div>

        {/* The counterparty is someone to reach, not a line of text. Once the
            number is released it becomes a call and a WhatsApp thread; before
            that the row says plainly why it is not there yet. */}
        <div className="booking-who">
          <span className="booking-who-label">{other.label}</span>
          <span className="booking-who-name">{other.name || "—"}</span>

          {other.phone ? (
            <span className="booking-who-actions">
              <a href={`tel:${other.phone}`} className="btn btn-outline btn-sm">
                <IconPhone size={14} />
                <span className="ltr">{other.phone}</span>
              </a>
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                   className="btn btn-outline btn-sm">
                  <IconChat size={14} />
                  {t("house.chatWhatsapp")}
                </a>
              )}
            </span>
          ) : b.status === "Pending" ? (
            <span className="booking-who-pending">{t("bookings.phoneOnceConfirmed")}</span>
          ) : null}
        </div>

        {/* Rendered bare rather than wrapped in .booking-actions: a page may
            pass buttons, a payments block, or both, and only the buttons want
            to sit in a row. */}
        {children}
      </div>
    </article>
  );
}
