import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../api/bookings";
import { getErrorMessage } from "../api/errors";
import { useTranslation } from "react-i18next";
import { useToast } from "../context/ToastContext";
import BookingCard from "../components/BookingCard";
import BookingPayments from "../components/BookingPayments";
import Pagination, { usePaged } from "../components/Pagination";
import ListToolbar from "../components/ListToolbar";

/**
 * The renter's three questions, in the order they ask them: where am I going,
 * what am I still waiting to hear about, and where have I been.
 */
const TABS = [
  { id: "all", key: "bookings.tabAll", match: () => true },
  { id: "pending", key: "bookings.tabPending", match: (b) => b.status === "Pending" },
  { id: "confirmed", key: "bookings.tabConfirmed", match: (b) => b.status === "Confirmed" },
  { id: "past", key: "bookings.tabPast",
    match: (b) => ["Completed", "Rejected", "Cancelled"].includes(b.status) },
];

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
  // Time first, status second — the opposite weighting to the owner's page,
  // and deliberately so. An owner asks "what needs my answer?", which is a
  // question about status. A renter asks "what is happening to me next?",
  // which is a question about dates: a confirmed stay and an unanswered
  // request both matter, and the one that matters now is whichever comes
  // sooner. The API returns newest-created first, which put a stay already
  // under way fifth and one seventeen months out at the top.
  const ordered = useMemo(() => {
    const closed = (b) => ["Completed", "Rejected", "Cancelled"].includes(b.status);
    return [...bookings].sort((a, b) => {
      if (closed(a) !== closed(b)) return closed(a) ? 1 : -1;
      // History reads best most-recent-first; everything ahead of you reads
      // best soonest-first.
      return closed(a)
        ? new Date(b.startDate) - new Date(a.startDate)
        : new Date(a.startDate) - new Date(b.startDate);
    });
  }, [bookings]);

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  // The property, and the owner once their name is on the booking. A renter
  // looking something up knows the flat far more often than the person.
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter((b) =>
      (b.houseTitle ?? "").toLowerCase().includes(q) ||
      (b.houseCity ?? "").toLowerCase().includes(q) ||
      (b.ownerName ?? "").toLowerCase().includes(q));
  }, [ordered, query]);

  const counts = useMemo(() => Object.fromEntries(
    TABS.map((x) => [x.id, searched.filter(x.match).length])), [searched]);

  const shown = useMemo(
    () => searched.filter(TABS.find((x) => x.id === tab).match),
    [searched, tab]);

  const paged = usePaged(shown, 6);

  // Narrowing returns the reader to page one; usePaged only clamps when the
  // new list is shorter than the page they happen to be on.
  function narrow(fn) {
    return (v) => { fn(v); paged.setPage(1); };
  }

  return (
    <div className="container section">
      <h1 className="page-title">{t("bookings.title")}</h1>
      <p className="muted page-sub">{t("bookings.sub")}</p>

      {error && <p className="error-text">{error}</p>}

      {!loading && bookings.length > 0 && (
        <ListToolbar
          tabs={TABS}
          tab={tab}
          onTab={narrow(setTab)}
          counts={counts}
          query={query}
          onQuery={narrow(setQuery)}
          placeholder={t("bookings.searchPlaceholder")}
          label={t("bookings.title")}
        />
      )}

      {loading ? (
        <p className="muted">{t("bookings.loading")}</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p>{t("bookings.empty")}</p>
          <Link to="/houses" className="btn btn-primary">{t("bookings.browse")}</Link>
        </div>
      ) : (
        shown.length === 0 ? (
          <div className="empty-state">
            <p>{t("bookings.noMatch")}</p>
            <button type="button" className="btn btn-outline"
                    onClick={() => { narrow(setQuery)(""); setTab("all"); }}>
              {t("houses.clearFilters")}
            </button>
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
        )
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
