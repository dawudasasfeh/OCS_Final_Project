import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createBooking, getAvailability } from "../api/bookings";
import { getErrorMessage } from "../api/errors";
import { useToast } from "../context/ToastContext";
import { addDays, endOfStay, formatDay, parseDay, toIso, todayIso } from "../utils/date";
import AvailabilityCalendar from "./AvailabilityCalendar";

import { DURATION_TYPE, UNIT_NOUN } from "../utils/duration";

/**
 * Mirrors the overlap test in BookingService.CreateAsync: the *requested* range
 * is padded by the turnover gap on both sides, then compared against the stored
 * dates. Padding the request rather than the stored booking is what lets the
 * same gap apply to whichever side a new stay lands on.
 *
 * This is a hint, not the rule. The server still runs the real check, because
 * two people can be looking at the same free week at the same moment.
 */
function clashes(startIso, durationType, count, booked, turnoverDays) {
  if (!startIso || count < 1) return false;

  const padStart = addDays(parseDay(startIso), -turnoverDays);
  const padEnd = addDays(endOfStay(startIso, durationType, count), turnoverDays);

  return booked.some((b) => padStart < parseDay(b.to) && parseDay(b.from) < padEnd);
}

/**
 * The first start date from `fromIso` on which the whole stay actually fits.
 *
 * Finding a free *day* is not enough: a listing can have three free days and no
 * free week. Reusing `clashes` rather than a second test of its own means the
 * suggested date can never be one the form then rejects.
 *
 * Returns `fromIso` unchanged if nothing fits within the horizon — at that
 * point the clash message is the honest answer.
 */
function firstBookableStart(fromIso, durationType, count, booked, turnoverDays, horizonDays = 365) {
  let d = parseDay(fromIso);

  for (let i = 0; i < horizonDays; i++) {
    const iso = toIso(d);
    if (!clashes(iso, durationType, count, booked, turnoverDays)) return iso;
    d = addDays(d, 1);
  }
  return fromIso;
}

export default function BookingForm({ house }) {
  const toast = useToast();
  const [startDate, setStartDate] = useState(todayIso);
  const [durationCount, setDurationCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  const [booked, setBooked] = useState([]);
  const [turnoverDays, setTurnoverDays] = useState(house.turnoverDays ?? 0);

  // The calendar is an aid, so a failure to load it must not block booking —
  // the form still works, the renter just picks dates blind as before.
  useEffect(() => {
    let alive = true;
    getAvailability(house.id)
      .then((a) => {
        if (!alive) return;
        const intervals = a.booked ?? [];
        const gap = a.turnoverDays ?? 0;

        setBooked(intervals);
        setTurnoverDays(gap);
        // Move off today if a stay starting today would not fit, so the panel
        // does not open on a date it is about to reject.
        setStartDate((current) =>
          firstBookableStart(current, house.priceUnit, 1, intervals, gap));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [house.id, house.priceUnit]);

  const noun = UNIT_NOUN[house.priceUnit] ?? "period";
  const count = Number(durationCount) || 0;
  const total = house.price * count;

  const overlaps = clashes(startDate, house.priceUnit, count, booked, turnoverDays);
  const lastNight = count >= 1
    ? addDays(endOfStay(startDate, house.priceUnit, count), -1)
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const booking = await createBooking({
        houseId: house.id,
        startDate,
        durationCount: count,
        durationType: DURATION_TYPE[house.priceUnit],
      });
      setCreated(booking);
      toast.success("Booking request sent. The owner will confirm or decline.");
    } catch (err) {
      const message = getErrorMessage(err, "Could not send the booking request.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="booking-done">
        <p className="booking-done-title">Request sent</p>
        <p className="muted">
          {formatDay(created.startDate)} — {formatDay(created.lastNight)}
        </p>
        <p className="booking-total">
          <span>Total</span>
          <strong>{created.totalPrice} JOD</strong>
        </p>
        <p className="muted booking-note">
          The owner will confirm or decline. Their phone number appears once the
          booking is confirmed.
        </p>
        <Link to="/my-bookings" className="btn btn-outline phone-btn">
          View my bookings
        </Link>
      </div>
    );
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      {error && <p className="error-text">{error}</p>}

      <AvailabilityCalendar
        booked={booked}
        turnoverDays={turnoverDays}
        value={startDate}
        onChange={setStartDate}
      />

      <div className="field">
        <label className="label" htmlFor="startDate">Start date</label>
        <input
          id="startDate"
          className="input"
          type="date"
          min={todayIso()}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="durationCount">How many {noun}s?</label>
        <input
          id="durationCount"
          className="input"
          type="number"
          min="1"
          max="60"
          value={durationCount}
          onChange={(e) => setDurationCount(e.target.value)}
          required
        />
      </div>

      {lastNight && (
        <p className="muted booking-note">
          {formatDay(startDate)} — {formatDay(toIso(lastNight))}
        </p>
      )}

      {overlaps && (
        <p className="error-text">
          Those dates run into an existing booking. Pick a different start date
          or a shorter stay.
        </p>
      )}

      <p className="booking-total">
        <span>{count} {noun}{count === 1 ? "" : "s"} × {house.price} JOD</span>
        <strong>{total} JOD</strong>
      </p>

      <button
        className="btn btn-primary phone-btn"
        type="submit"
        disabled={busy || count < 1 || overlaps}
      >
        {busy ? "Sending…" : "Request booking"}
      </button>

      <p className="muted booking-note">
        The owner keeps {turnoverDays} day
        {turnoverDays === 1 ? "" : "s"} between stays, so dates close to an
        existing booking may be refused.
      </p>
    </form>
  );
}
