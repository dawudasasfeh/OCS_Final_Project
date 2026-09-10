import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPendingHouses, approveHouse, rejectHouse } from "../api/houses";
import {
  getPendingTestimonials,
  approveTestimonial,
  rejectTestimonial,
} from "../api/testimonials";
import { getPendingPayments, confirmPayment, rejectPayment } from "../api/payments";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/errors";
import { imageUrl } from "../utils/images";
import { formatDay } from "../utils/date";
import { useToast } from "../context/ToastContext";

const spaced = (s = "") => s.replace(/([a-z])([A-Z])/g, "$1 $2");

// spaced() would turn CliQ into "Cli Q", so payment methods are named rather
// than derived. Keys are Domain/Enums/PaymentMethod.cs.
const TABS = [
  { key: "listings", labelKey: "admin.tabListings" },
  { key: "testimonials", labelKey: "admin.tabTestimonials" },
  { key: "payments", labelKey: "admin.tabPayments" },
];

/**
 * Each tab is the same shape: fetch a pending list, act on one row, replace or
 * drop that row. Only the loader, the actions and the body differ, so they are
 * passed in rather than written three times.
 */
function useQueue(load, onChanged) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await load());
    } catch (err) {
      setError(getErrorMessage(err, "Could not load this queue."));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => { refresh(); }, [refresh]);

  // Acting on a row always removes it from a pending queue, whichever way the
  // decision went — it is no longer pending.
  async function decide(id, action, failure, success) {
    setError("");
    setBusyId(id);
    try {
      await action(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      // The row vanishing is the only other feedback, and on a queue of one
      // that just looks like the list emptied for no reason.
      toast.success(success);
      onChanged?.();
    } catch (err) {
      const message = getErrorMessage(err, failure);
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  return { items, loading, error, busyId, decide };
}

function QueueSection({ queue, empty, children }) {
  const { t } = useTranslation();
  if (queue.loading) return <p className="muted">{t("admin.loading")}</p>;

  return (
    <>
      {queue.error && <p className="error-text">{queue.error}</p>}
      {queue.items.length === 0
        ? <div className="empty-state"><p>{empty}</p></div>
        : <div className="booking-list">{children}</div>}
    </>
  );
}

function Listings({ onChanged }) {
  const { t } = useTranslation();
  const queue = useQueue(getPendingHouses, onChanged);

  return (
    <QueueSection queue={queue} empty={t("admin.noListings")}>
      {queue.items.map((h) => (
        <article className="listing-card" key={h.id}>
          <Link to={`/houses/${h.id}`} className="booking-thumb">
            {h.imageUrls?.[0]
              ? <img src={imageUrl(h.imageUrls[0])} alt="" />
              : <span>{t("card.noPhoto")}</span>}
          </Link>

          <div className="booking-body">
            <div className="booking-card-head">
              <Link to={`/houses/${h.id}`} className="booking-title" dir="auto">{h.title}</Link>
              <span className="badge badge-pending">{t("status.pending")}</span>
            </div>

            <p className="booking-sub">
              {h.neighborhood ? `${h.neighborhood}, ` : ""}{t(`city.${h.city}`, { defaultValue: h.city })} · {t(`propertyType.${h.propertyType.charAt(0).toLowerCase()}${h.propertyType.slice(1)}`, { defaultValue: spaced(h.propertyType) })}
            </p>

            <dl className="booking-facts">
              <div><dt>{t("admin.owner")}</dt><dd>{h.ownerName}</dd></div>
              <div><dt>{t("admin.price")}</dt><dd><strong>{h.price} {t("common.jod")}</strong> {t("card.perUnit", { unit: t(`period.${h.priceUnit.toLowerCase()}`, { defaultValue: h.priceUnit.toLowerCase() }) })}</dd></div>
              <div><dt>{t("admin.property")}</dt><dd>{t("admin.propertySummary", { beds: h.bedrooms, baths: h.bathrooms, area: h.areaSqM })}</dd></div>
            </dl>

            <p className="admin-excerpt" dir="auto">{h.description}</p>

            <div className="booking-actions">
              <button
                type="button" className="btn btn-primary"
                disabled={queue.busyId === h.id}
                onClick={() => queue.decide(h.id, approveHouse, t("admin.couldNotApproveListing"), t("admin.listingApproved"))}
              >
                {t("admin.approve")}
              </button>
              <button
                type="button" className="btn btn-outline"
                disabled={queue.busyId === h.id}
                onClick={() => queue.decide(h.id, rejectHouse, t("admin.couldNotRejectListing"), t("admin.listingRejected"))}
              >
                {t("admin.reject")}
              </button>
            </div>
          </div>
        </article>
      ))}
    </QueueSection>
  );
}

function Testimonials({ onChanged }) {
  const { t } = useTranslation();
  const queue = useQueue(getPendingTestimonials, onChanged);

  return (
    <QueueSection queue={queue} empty={t("admin.noTestimonials")}>
      {/* Named item, not t — the map parameter would shadow the translation
          function for the whole block. */}
      {queue.items.map((item) => (
        <article className="admin-card" key={item.id}>
          <div className="booking-card-head">
            <span className="booking-title">{item.userName}</span>
            <span className="badge badge-pending">{t(`status.${item.status.toLowerCase()}`, { defaultValue: item.status })}</span>
          </div>
          <p className="booking-sub">{t("admin.written", { date: formatDay(item.createdAt.slice(0, 10)) })}</p>

          <blockquote className="admin-quote" dir="auto">{item.content}</blockquote>

          <div className="booking-actions">
            <button
              type="button" className="btn btn-primary"
              disabled={queue.busyId === item.id}
              onClick={() => queue.decide(item.id, approveTestimonial, t("admin.couldNotApproveTestimonial"), t("admin.testimonialPublished"))}
            >
              {t("admin.approve")}
            </button>
            <button
              type="button" className="btn btn-outline"
              disabled={queue.busyId === item.id}
              onClick={() => queue.decide(item.id, rejectTestimonial, t("admin.couldNotRejectTestimonial"), t("admin.testimonialRejected"))}
            >
              {t("admin.reject")}
            </button>
          </div>
        </article>
      ))}
    </QueueSection>
  );
}

function Payments({ onChanged }) {
  const { t } = useTranslation();
  const queue = useQueue(getPendingPayments, onChanged);

  return (
    <QueueSection queue={queue} empty={t("admin.noPayments")}>
      {queue.items.map((p) => (
        <article className="admin-card" key={p.id}>
          <div className="booking-card-head">
            <span className="booking-title">{p.payerName}</span>
            <span className="badge badge-pending">{t(`status.${p.status.toLowerCase()}`, { defaultValue: p.status })}</span>
          </div>

          <dl className="booking-facts">
            <div><dt>{t("admin.amount")}</dt><dd><strong>{p.amount} {t("common.jod")}</strong></dd></div>
            <div><dt>{t("admin.method")}</dt><dd>{t(`paymentMethod.${p.method}`, { defaultValue: p.method })}</dd></div>
            <div><dt>{t("admin.recorded")}</dt><dd>{formatDay(p.createdAt.slice(0, 10))}</dd></div>
          </dl>

          {p.referenceNote && <p className="admin-excerpt">{p.referenceNote}</p>}

          <p className="field-hint admin-note">
            {t("admin.confirmingGrants", { name: p.payerName })}
          </p>

          <div className="booking-actions">
            <button
              type="button" className="btn btn-primary"
              disabled={queue.busyId === p.id}
              onClick={() => queue.decide(p.id, confirmPayment, t("admin.couldNotConfirmPayment"), t("admin.paymentConfirmed"))}
            >
              Confirm
            </button>
            <button
              type="button" className="btn btn-outline"
              disabled={queue.busyId === p.id}
              onClick={() => queue.decide(p.id, rejectPayment, t("admin.couldNotRejectPayment"), t("admin.paymentRejected"))}
            >
              {t("admin.reject")}
            </button>
          </div>
        </article>
      ))}
    </QueueSection>
  );
}

export default function Admin() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("listings");
  const [counts, setCounts] = useState({});

  // Counted at this level rather than inside each tab, because a badge has to
  // show what is waiting on the tabs you are NOT looking at — that is the whole
  // point of it. A failed count is left absent rather than shown as zero.
  const refreshCounts = useCallback(async () => {
    const [listings, testimonials, payments] = await Promise.all([
      getPendingHouses().then((r) => r.length).catch(() => null),
      getPendingTestimonials().then((r) => r.length).catch(() => null),
      getPendingPayments().then((r) => r.length).catch(() => null),
    ]);
    setCounts({ listings, testimonials, payments });
  }, []);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  return (
    <div className="container section">
      <h1 className="page-title">{t("admin.title")}</h1>
      <p className="muted page-sub">
        {t("admin.sub")}
      </p>

      <div className="admin-tabs">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            type="button"
            className={tabDef.key === tab ? "admin-tab active" : "admin-tab"}
            onClick={() => setTab(tabDef.key)}
          >
            {t(tabDef.labelKey)}
            {counts[tabDef.key] > 0 && <span className="admin-tab-count">{counts[tabDef.key]}</span>}
          </button>
        ))}
      </div>

      {/* Mounted one at a time, so switching tabs refetches rather than showing
          a queue that another admin may already have emptied. */}
      {tab === "listings" && <Listings onChanged={refreshCounts} />}
      {tab === "testimonials" && <Testimonials onChanged={refreshCounts} />}
      {tab === "payments" && <Payments onChanged={refreshCounts} />}
    </div>
  );
}
