import { useState } from "react";
import { Link } from "react-router-dom";
import { createBooking } from "../api/bookings";
import { getErrorMessage } from "../api/errors";
import { formatDay } from "../utils/date";

import { DURATION_TYPE, UNIT_NOUN } from "../utils/duration";

const todayIso = () =>{
    const d= new Date();
    const pad = (n) => String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

export default function BookingForm({house}){
    const [startDate, setStartDate] = useState(todayIso);
    const [durationCount, setDurationCount] = useState(1);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [created, setCreated] = useState(null);

    const noun = UNIT_NOUN[house.priceUnit] ?? "period";
    const count = Number(durationCount) || 0;
    const total = house.price * count;

    async function handleSubmit(e){
        e.preventDefault();
        setError("");
        setBusy(true);

        try{
            const booking = await createBooking({
                houseId : house.id,
                startDate,
                durationCount: count,
                durationType: DURATION_TYPE[house.priceUnit], 
            });
            setCreated(booking);
        } catch (err){
            setError(getErrorMessage(err,"Could not send the booking request."));
        } finally {
            setBusy(false);
        }
    }

    if(created){
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

      <p className="booking-total">
        <span>{count} {noun}{count === 1 ? "" : "s"} × {house.price} JOD</span>
        <strong>{total} JOD</strong>
      </p>

      <button
        className="btn btn-primary phone-btn"
        type="submit"
        disabled={busy || count < 1}
      >
        {busy ? "Sending…" : "Request booking"}
      </button>

      <p className="muted booking-note">
        The owner keeps {house.turnoverDays} day
        {house.turnoverDays === 1 ? "" : "s"} between stays, so dates close to an
        existing booking may be refused.
      </p>
    </form>
  );

}