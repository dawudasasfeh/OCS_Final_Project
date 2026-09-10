import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBookingRequests, confirmBooking, rejectBooking } from "../api/bookings";
import { getErrorMessage } from "../api/errors";
import { useTranslation } from "react-i18next";
import { useToast } from "../context/ToastContext";
import BookingCard from "../components/BookingCard";
import BookingPayments from "../components/BookingPayments";
import Pagination, { usePaged } from "../components/Pagination";

export default function BookingRequests() {
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
        const data = await getBookingRequests();
        if (!cancelled) setBookings(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, t("requests.couldNotLoad")));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function decide(id, action, failure, success) {
    setError("");
    setBusyId(id);
    try {
      const updated = await action(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      toast.success(success);
    } catch (err) {
      const message = getErrorMessage(err, failure);
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = bookings.filter((b) => b.status === "Pending").length;

  // The pending count in the heading counts every request, not the page:
  // an owner needs to know six people are waiting even while looking at
  // the first four.
  const paged = usePaged(bookings, 6);

  return (
    <div className="container section">
      <h1 className="page-title">{t("requests.title")}</h1>
      <p className="muted page-sub">
        {t("requests.sub")}{" "}
        {pendingCount > 0
          ? t("requests.waiting", { count: pendingCount })
          : t("requests.nothingWaiting")}{" "}
        {t("requests.confirmingShares")}
      </p>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted">{t("requests.loading")}</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p>{t("requests.empty")}</p>
          <Link to="/my-listings" className="btn btn-outline">{t("nav.myListings")}</Link>
        </div>
      ) : (
        <div className="booking-list">
          {paged.items.map((b) => (
            <BookingCard key={b.id} booking={b} side="owner">
              {b.status === "Confirmed" && <BookingPayments booking={b} side="owner" />}
              {b.status === "Pending" && (
                <div className="booking-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => decide(b.id, confirmBooking, t("requests.couldNotConfirm"), t("requests.confirmed"))}
                    disabled={busyId === b.id}
                  >
                    {busyId === b.id ? t("requests.working") : t("requests.confirm")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => decide(b.id, rejectBooking, t("requests.couldNotReject"), t("requests.declined"))}
                    disabled={busyId === b.id}
                  >
                    {t("requests.decline")}
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
        label={t("requests.title")}
      />
    </div>
  );
}
