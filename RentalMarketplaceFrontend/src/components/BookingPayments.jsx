import { useEffect, useState } from "react";
import {
  getBookingPayments,
  createBookingPayment,
  confirmPayment,
  rejectPayment,
} from "../api/payments";
import { getErrorMessage } from "../api/errors";
import { useFieldErrors } from "../utils/validation";
import FieldError from "./FieldError";
import { formatDay } from "../utils/date";

// Values are Domain/Enums/PaymentMethod.cs.
const METHODS = [
  { value: 1, label: "Cash" },
  { value: 2, label: "CliQ" },
  { value: 3, label: "Bank transfer" },
  { value: 4, label: "Card" },
];

const METHOD_LABEL = Object.fromEntries(
  [["Cash", "Cash"], ["CliQ", "CliQ"], ["BankTransfer", "Bank transfer"], ["Card", "Card"]]
);

/**
 * The payment log for one booking.
 *
 * side="renter" can record a payment; side="owner" can confirm or reject one.
 * Beytak never moves money — this is the two parties writing down that it moved.
 */
export default function BookingPayments({ booking, side }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { errors, validate, clearError } = useFieldErrors();
  const [busyId, setBusyId] = useState(null);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(2);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getBookingPayments(booking.id)
      .then((data) => { if (!cancelled) setPayments(data); })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "Could not load payments."));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [booking.id]);

  const paid = payments
    .filter((p) => p.status === "Confirmed")
    .reduce((sum, p) => sum + p.amount, 0);

  async function handleRecord(e) {
    e.preventDefault();
    setError("");

    if (!validate(e.currentTarget)) return;

    setSaving(true);

    try {
      const created = await createBookingPayment({
        bookingId: booking.id,
        amount: Number(amount),
        method: Number(method),
        referenceNote: note.trim() || null,
      });
      setPayments((prev) => [...prev, created]);
      setAmount("");
      setNote("");
      setOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not record the payment."));
    } finally {
      setSaving(false);
    }
  }

  async function decide(id, action, failure) {
    setError("");
    setBusyId(id);
    try {
      const updated = await action(id);
      setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      setError(getErrorMessage(err, failure));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return null;

  return (
    <div className="pay-block">
      <div className="pay-head">
        <span className="pay-title">Payments</span>
        <span className="muted">
          {paid} of {booking.totalPrice} JOD confirmed
        </span>
      </div>

      {error && <p className="error-text">{error}</p>}

      {payments.length > 0 && (
        <ul className="pay-list">
          {payments.map((p) => (
            <li key={p.id} className="pay-row">
              <span className="pay-amount">{p.amount} JOD</span>
              <span className="muted">
                {METHOD_LABEL[p.method] ?? p.method} · {formatDay(p.createdAt.slice(0, 10))}
              </span>
              <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>

              {side === "owner" && p.status === "Pending" && (
                <span className="pay-actions">
                  <button
                    type="button" disabled={busyId === p.id}
                    onClick={() => decide(p.id, confirmPayment, "Could not confirm this payment.")}
                  >
                    Confirm
                  </button>
                  <button
                    type="button" disabled={busyId === p.id}
                    onClick={() => decide(p.id, rejectPayment, "Could not reject this payment.")}
                  >
                    Reject
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {side === "renter" && booking.status === "Confirmed" && (
        open ? (
          <form className="pay-form" onSubmit={handleRecord} noValidate>
            <div className="pay-form-row">
              <input
                id="payAmount" aria-label="Amount"
                className="input" type="number" min="1" step="1" required
                placeholder="Amount in JOD"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); clearError("payAmount"); }}
              />
              <select
                className="input"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <FieldError>{errors.payAmount}</FieldError>

            <input
              id="payNote" aria-label="Reference"
              className="input" maxLength={250}
              placeholder="Reference, optional"
              value={note}
              onChange={(e) => { setNote(e.target.value); clearError("payNote"); }}
            />
            <FieldError>{errors.payNote}</FieldError>

            <div className="booking-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Recording…" : "Record payment"}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button className="btn btn-outline pay-add" type="button" onClick={() => setOpen(true)}>
            Record a payment
          </button>
        )
      )}
    </div>
  );
}
