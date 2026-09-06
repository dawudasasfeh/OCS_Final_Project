import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPendingHouses, approveHouse, rejectHouse } from "../api/houses";
import {
  getPendingTestimonials,
  approveTestimonial,
  rejectTestimonial,
} from "../api/testimonials";
import { getPendingPayments, confirmPayment, rejectPayment } from "../api/payments";
import { getErrorMessage } from "../api/errors";
import { imageUrl } from "../utils/images";
import { formatDay } from "../utils/date";

const spaced = (s = "") => s.replace(/([a-z])([A-Z])/g, "$1 $2");

// spaced() would turn CliQ into "Cli Q", so payment methods are named rather
// than derived. Keys are Domain/Enums/PaymentMethod.cs.
const METHOD_LABEL = {
  Cash: "Cash",
  CliQ: "CliQ",
  BankTransfer: "Bank transfer",
  Card: "Card",
};

const TABS = [
  { key: "listings", label: "Listings" },
  { key: "testimonials", label: "Testimonials" },
  { key: "payments", label: "Subscriptions" },
];

/**
 * Each tab is the same shape: fetch a pending list, act on one row, replace or
 * drop that row. Only the loader, the actions and the body differ, so they are
 * passed in rather than written three times.
 */
function useQueue(load) {
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
  async function decide(id, action, failure) {
    setError("");
    setBusyId(id);
    try {
      await action(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, failure));
    } finally {
      setBusyId(null);
    }
  }

  return { items, loading, error, busyId, decide };
}

function QueueSection({ queue, empty, children }) {
  if (queue.loading) return <p className="muted">Loading…</p>;

  return (
    <>
      {queue.error && <p className="error-text">{queue.error}</p>}
      {queue.items.length === 0
        ? <div className="empty-state"><p>{empty}</p></div>
        : <div className="booking-list">{children}</div>}
    </>
  );
}

function Listings() {
  const queue = useQueue(getPendingHouses);

  return (
    <QueueSection queue={queue} empty="No listings waiting for review.">
      {queue.items.map((h) => (
        <article className="listing-card" key={h.id}>
          <Link to={`/houses/${h.id}`} className="booking-thumb">
            {h.imageUrls?.[0]
              ? <img src={imageUrl(h.imageUrls[0])} alt="" />
              : <span>NO PHOTO</span>}
          </Link>

          <div className="booking-body">
            <div className="booking-card-head">
              <Link to={`/houses/${h.id}`} className="booking-title">{h.title}</Link>
              <span className="badge badge-pending">Pending</span>
            </div>

            <p className="booking-sub">
              {h.neighborhood ? `${h.neighborhood}, ` : ""}{h.city} · {spaced(h.propertyType)}
            </p>

            <dl className="booking-facts">
              <div><dt>Owner</dt><dd>{h.ownerName}</dd></div>
              <div><dt>Price</dt><dd><strong>{h.price} JOD</strong> / {h.priceUnit.toLowerCase()}</dd></div>
              <div><dt>Property</dt><dd>{h.bedrooms} bed · {h.bathrooms} bath · {h.areaSqM} m²</dd></div>
            </dl>

            <p className="admin-excerpt">{h.description}</p>

            <div className="booking-actions">
              <button
                type="button" className="btn btn-primary"
                disabled={queue.busyId === h.id}
                onClick={() => queue.decide(h.id, approveHouse, "Could not approve this listing.")}
              >
                Approve
              </button>
              <button
                type="button" className="btn btn-outline"
                disabled={queue.busyId === h.id}
                onClick={() => queue.decide(h.id, rejectHouse, "Could not reject this listing.")}
              >
                Reject
              </button>
            </div>
          </div>
        </article>
      ))}
    </QueueSection>
  );
}

function Testimonials() {
  const queue = useQueue(getPendingTestimonials);

  return (
    <QueueSection queue={queue} empty="No testimonials waiting for review.">
      {queue.items.map((t) => (
        <article className="admin-card" key={t.id}>
          <div className="booking-card-head">
            <span className="booking-title">{t.userName}</span>
            <span className="badge badge-pending">{t.status}</span>
          </div>
          <p className="booking-sub">Written {formatDay(t.createdAt.slice(0, 10))}</p>

          <blockquote className="admin-quote">{t.content}</blockquote>

          <div className="booking-actions">
            <button
              type="button" className="btn btn-primary"
              disabled={queue.busyId === t.id}
              onClick={() => queue.decide(t.id, approveTestimonial, "Could not approve this testimonial.")}
            >
              Approve
            </button>
            <button
              type="button" className="btn btn-outline"
              disabled={queue.busyId === t.id}
              onClick={() => queue.decide(t.id, rejectTestimonial, "Could not reject this testimonial.")}
            >
              Reject
            </button>
          </div>
        </article>
      ))}
    </QueueSection>
  );
}

function Payments() {
  const queue = useQueue(getPendingPayments);

  return (
    <QueueSection queue={queue} empty="No subscription payments waiting.">
      {queue.items.map((p) => (
        <article className="admin-card" key={p.id}>
          <div className="booking-card-head">
            <span className="booking-title">{p.payerName}</span>
            <span className="badge badge-pending">{p.status}</span>
          </div>

          <dl className="booking-facts">
            <div><dt>Amount</dt><dd><strong>{p.amount} JOD</strong></dd></div>
            <div><dt>Method</dt><dd>{METHOD_LABEL[p.method] ?? p.method}</dd></div>
            <div><dt>Recorded</dt><dd>{formatDay(p.createdAt.slice(0, 10))}</dd></div>
          </dl>

          {p.referenceNote && <p className="admin-excerpt">{p.referenceNote}</p>}

          <p className="field-hint admin-note">
            Confirming this also gives {p.payerName} an active subscription.
          </p>

          <div className="booking-actions">
            <button
              type="button" className="btn btn-primary"
              disabled={queue.busyId === p.id}
              onClick={() => queue.decide(p.id, confirmPayment, "Could not confirm this payment.")}
            >
              Confirm
            </button>
            <button
              type="button" className="btn btn-outline"
              disabled={queue.busyId === p.id}
              onClick={() => queue.decide(p.id, rejectPayment, "Could not reject this payment.")}
            >
              Reject
            </button>
          </div>
        </article>
      ))}
    </QueueSection>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("listings");

  return (
    <div className="container section">
      <h1 className="page-title">Admin</h1>
      <p className="muted page-sub">
        Everything waiting on a decision. Listings and testimonials stay hidden
        from renters until they are approved.
      </p>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={t.key === tab ? "admin-tab active" : "admin-tab"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Mounted one at a time, so switching tabs refetches rather than showing
          a queue that another admin may already have emptied. */}
      {tab === "listings" && <Listings />}
      {tab === "testimonials" && <Testimonials />}
      {tab === "payments" && <Payments />}
    </div>
  );
}
