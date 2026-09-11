import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBookingRequests, confirmBooking, rejectBooking } from "../api/bookings";
import { getErrorMessage } from "../api/errors";
import { useTranslation } from "react-i18next";
import { useToast } from "../context/ToastContext";
import BookingCard from "../components/BookingCard";
import BookingPayments from "../components/BookingPayments";
import Pagination, { usePaged } from "../components/Pagination";
import ListToolbar from "../components/ListToolbar";

/**
 * Closed covers three end states rather than giving each a tab of its own.
 * Rejected, cancelled and completed are all 'nothing more to do here', and
 * three tabs holding one row each is a worse answer than one holding three.
 */
const TABS = [
  { id: "all", key: "requests.tabAll", match: () => true },
  { id: "pending", key: "requests.tabPending", match: (b) => b.status === "Pending" },
  { id: "confirmed", key: "requests.tabConfirmed", match: (b) => b.status === "Confirmed" },
  { id: "closed", key: "requests.tabClosed",
    match: (b) => ["Rejected", "Cancelled", "Completed"].includes(b.status) },
];

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

  // Urgency order, not arrival order. This page exists to answer requests, so
  // the ones still waiting come first; a rejected booking from March is
  // history and belongs at the bottom. Within a group the soonest stay leads,
  // because a request starting on Friday needs an answer before one starting
  // in the spring.
  const ordered = useMemo(() => {
    const rank = { Pending: 0, Confirmed: 1, Completed: 2, Cancelled: 3, Rejected: 3 };
    return [...bookings].sort((a, b) =>
      (rank[a.status] ?? 9) - (rank[b.status] ?? 9) ||
      new Date(a.startDate) - new Date(b.startDate));
  }, [bookings]);

  // The pending count in the heading counts every request, not the page:
  // an owner needs to know six people are waiting even while looking at
  // the first four.
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  // Name, property and phone, because an owner arrives at this box from
  // three directions: the renter rang and said their name, they know the
  // flat but not the person, or a transfer landed and all they have is the
  // number it came from. Digits are stripped from the phone on both sides
  // so 0793 308871 finds 0793308871.
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    const digits = q.replace(/\D/g, "");
    return ordered.filter((b) =>
      (b.renterName ?? "").toLowerCase().includes(q) ||
      (b.houseTitle ?? "").toLowerCase().includes(q) ||
      (digits.length >= 3 && (b.renterPhone ?? "").replace(/\D/g, "").includes(digits)));
  }, [ordered, query]);

  // Counted after the search, not before. A tab reading "Confirmed (4)" over
  // a search that matched one of them would be counting rows the reader
  // cannot see.
  const counts = useMemo(() => Object.fromEntries(
    TABS.map((x) => [x.id, searched.filter(x.match).length])), [searched]);

  const shown = useMemo(
    () => searched.filter(TABS.find((x) => x.id === tab).match),
    [searched, tab]);

  const paged = usePaged(shown, 6);

  // Narrowing the list has to return the reader to the first page. usePaged
  // clamps only when the new list is shorter than the page they are on, so a
  // filter that still has three pages would silently leave them on page two.
  function narrow(fn) {
    return (v) => { fn(v); paged.setPage(1); };
  }

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

      {!loading && bookings.length > 0 && (
        <ListToolbar
          tabs={TABS}
          tab={tab}
          onTab={narrow(setTab)}
          counts={counts}
          query={query}
          onQuery={narrow(setQuery)}
          placeholder={t("requests.searchPlaceholder")}
          label={t("requests.title")}
        />
      )}

      {loading ? (
        <p className="muted">{t("requests.loading")}</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p>{t("requests.empty")}</p>
          <Link to="/my-listings" className="btn btn-outline">{t("nav.myListings")}</Link>
        </div>
      ) : (
        shown.length === 0 ? (
          <div className="empty-state">
            <p>{t("requests.noMatch")}</p>
            <button type="button" className="btn btn-outline"
                    onClick={() => { narrow(setQuery)(""); setTab("all"); }}>
              {t("houses.clearFilters")}
            </button>
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
        )
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
