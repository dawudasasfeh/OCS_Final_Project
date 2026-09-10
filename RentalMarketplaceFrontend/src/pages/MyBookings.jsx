import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../api/bookings";
import { getErrorMessage } from "../api/errors";
import { useTranslation } from "react-i18next";
import { useToast } from "../context/ToastContext";
import BookingCard from "../components/BookingCard";
import BookingPayments from "../components/BookingPayments";
import Pagination, { usePaged } from "../components/Pagination";

export default function MyBookings() {
  const { t } = useTranslation();
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
        if (!cancelled) setError(getErrorMessage(err, t("bookings.couldNotLoad")));
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
      toast.success(t("bookings.cancelled"));
    } catch (err) {
      const message = getErrorMessage(err, t("bookings.couldNotCancel"));
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  // Six per page. A booking card is tall — dates, price, payment state and
  // sometimes a payment form — so six is already a long scroll, and a renter
  // with two years of history should not have to load all of it to reach the
  // one they are looking for.
  const paged = usePaged(bookings, 6);

  return (
    <div className="container section">
      <h1 className="page-title">{t("bookings.title")}</h1>
      <p className="muted page-sub">
        Requests you have sent. The owner's phone number appears once a booking is
        confirmed.
      </p>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted">{t("bookings.loading")}</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p>{t("bookings.empty")}</p>
          <Link to="/houses" className="btn btn-primary">{t("bookings.browse")}</Link>
        </div>
      ) : (
        <div className="booking-list">
          {paged.items.map((b) => (
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
                    {busyId === b.id ? t("bookings.cancelling") : t("bookings.cancelRequest")}
                  </button>
                </div>
              )}
            </BookingCard>
          ))}
        </div>
      )}

      <Pagination
        page={paged.page}
        totalPages={paged.totalPages}
        onChange={paged.setPage}
        label={t("bookings.title")}
      />
    </div>
  );
}
