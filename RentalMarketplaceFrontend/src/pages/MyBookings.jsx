import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../api/bookings";
import { getErrorMessage } from "../api/errors";
import { useToast } from "../context/ToastContext";
import BookingCard from "../components/BookingCard";
import BookingPayments from "../components/BookingPayments";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getMyBookings();
        if (!cancelled) setBookings(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Could not load your bookings."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function handleCancel(id) {
    setError("");
    setBusyId(id);
    try {
      const updated = await cancelBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      toast.success("Booking cancelled.");
    } catch (err) {
      const message = getErrorMessage(err, "Could not cancel this booking.");
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container section">
      <h1 className="page-title">My bookings</h1>
      <p className="muted page-sub">
        Requests you have sent. The owner's phone number appears once a booking is
        confirmed.
      </p>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted">Loading your bookings…</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p>You have not booked anything yet.</p>
          <Link to="/houses" className="btn btn-primary">Browse properties</Link>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} side="renter">
              {b.status === "Confirmed" && <BookingPayments booking={b} side="renter" />}
              {b.status === "Pending" && (
                <div className="booking-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleCancel(b.id)}
                    disabled={busyId === b.id}
                  >
                    {busyId === b.id ? "Cancelling…" : "Cancel request"}
                  </button>
                </div>
              )}
            </BookingCard>
          ))}
        </div>
      )}
    </div>
  );
}
