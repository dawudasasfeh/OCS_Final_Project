import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBookingRequests, confirmBooking, rejectBooking } from "../api/bookings";
import { getErrorMessage } from "../api/errors";
import BookingCard from "../components/BookingCard";

export default function BookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getBookingRequests();
        if (!cancelled) setBookings(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Could not load your booking requests."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function decide(id, action, failure) {
    setError("");
    setBusyId(id);
    try {
      const updated = await action(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (err) {
      setError(getErrorMessage(err, failure));
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = bookings.filter((b) => b.status === "Pending").length;

  return (
    <div className="container section">
      <h1 className="page-title">Booking requests</h1>
      <p className="muted page-sub">
        Requests for your properties.{" "}
        {pendingCount > 0
          ? `${pendingCount} waiting for your answer.`
          : "Nothing waiting for your answer."}{" "}
        Confirming shares your phone number with the renter, and theirs with you.
      </p>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted">Loading requests…</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p>Nobody has requested one of your properties yet.</p>
          <Link to="/my-listings" className="btn btn-outline">My listings</Link>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} side="owner">
              {b.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => decide(b.id, confirmBooking, "Could not confirm this booking.")}
                    disabled={busyId === b.id}
                  >
                    {busyId === b.id ? "Working…" : "Confirm"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => decide(b.id, rejectBooking, "Could not reject this booking.")}
                    disabled={busyId === b.id}
                  >
                    Reject
                  </button>
                </>
              )}
            </BookingCard>
          ))}
        </div>
      )}
    </div>
  );
}
