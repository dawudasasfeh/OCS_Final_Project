import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMySubscription } from "../api/subscription";
import { createSubscriptionPayment, getMyPayments } from "../api/payments";
import { getErrorMessage } from "../api/errors";
import { formatDay } from "../utils/date";

// Values are Domain/Enums/PaymentMethod.cs.
const METHODS = [
  { value: 1, label: "Cash" },
  { value: 2, label: "CliQ" },
  { value: 3, label: "Bank transfer" },
  { value: 4, label: "Card" },
];

export default function Subscribe() {
  const [sub, setSub] = useState(null);
  const [pending, setPending] = useState(null);
  const [method, setMethod] = useState(2);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function load() {
    // Read the subscription from the API, never from user.isSubscribed: that
    // comes from the JWT and stays stale until the next sign-in.
    const [s, payments] = await Promise.all([getMySubscription(), getMyPayments()]);
    setSub(s);
    setPending(
      payments.find((p) => p.purpose === "SubscriptionPayment" && p.status === "Pending") ?? null
    );
  }

  useEffect(() => {
    let cancelled = false;
    load()
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err, "Could not load your subscription.")); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      await createSubscriptionPayment({
        method: Number(method),
        referenceNote: note.trim() || null,
      });
      setSent(true);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not record your payment."));
    } finally {
      setBusy(false);
    }
  }

  if (!sub) {
    return (
      <div className="container section">
        {error ? <p className="error-text">{error}</p> : <p className="muted">Loading…</p>}
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="page-title">Subscription</h1>
      <p className="muted page-sub">
        Owners need an active subscription to publish a listing. It costs{" "}
        <strong>{sub.pricePerMonth} JOD</strong> per month.
      </p>

      {error && <p className="error-text">{error}</p>}

      <div className="sub-status">
        <span className={`badge badge-${sub.isActive ? "approved" : "rejected"}`}>
          {sub.isActive ? "Active" : "Not active"}
        </span>
        {sub.isActive ? (
          <p className="muted">
            Runs until <strong>{formatDay(sub.expiresAt)}</strong> — {sub.daysRemaining}{" "}
            day{sub.daysRemaining === 1 ? "" : "s"} left.{" "}
            <Link to="/houses/new">List a property</Link>.
          </p>
        ) : (
          <p className="muted">You cannot publish a listing until this is active.</p>
        )}
      </div>

      {pending ? (
        <div className="form-block sub-pending">
          <p className="booking-done-title">Payment recorded</p>
          <p className="muted">
            {pending.amount} JOD, recorded {formatDay(pending.createdAt.slice(0, 10))}.
            An administrator will confirm it, and your subscription starts then.
          </p>
        </div>
      ) : (
        <form className="listing-form" onSubmit={handleSubmit} noValidate>
          <fieldset className="form-block">
            <legend>{sub.isActive ? "Renew" : "Subscribe"}</legend>

            <p className="field-hint" style={{ marginTop: 0 }}>
              Pay {sub.pricePerMonth} JOD by whichever method suits you, then record
              it here. Beytak does not handle the money — an administrator checks
              that it arrived.
              {sub.isActive && " Renewing early adds a month to your current expiry."}
            </p>

            <div className="field">
              <label className="label" htmlFor="method">How did you pay?</label>
              <select
                id="method" className="input"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="note">
                Reference <span className="optional">optional</span>
              </label>
              <input
                id="note" className="input" maxLength={250}
                placeholder="CliQ alias, transfer reference, who you handed it to…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <p className="field-hint">
                Anything that helps the administrator match your payment.
              </p>
            </div>

            {sent && <p className="notice">Recorded. Waiting for confirmation.</p>}

            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Recording…" : `Record ${sub.pricePerMonth} JOD payment`}
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
