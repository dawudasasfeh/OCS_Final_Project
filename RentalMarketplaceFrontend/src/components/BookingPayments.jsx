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
import { useTranslation } from "react-i18next";

// Values are Domain/Enums/PaymentMethod.cs.
const METHODS = [
  { value: 1, key: "paymentMethod.Cash" },
  { value: 2, key: "paymentMethod.CliQ" },
  { value: 3, key: "paymentMethod.BankTransfer" },
  { value: 4, key: "paymentMethod.Card" },
];

/**
 * The payment log for one booking.
 *
 * side="renter" can record a payment; side="owner" can confirm or reject one.
 * Beytak never moves money — this is the two parties writing down that it moved.
 */
export default function BookingPayments({ booking, side }) {
  const { t } = useTranslation();
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
        if (!cancelled) setError(getErrorMessage(err, t("booking.couldNotLoadPayments")));
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
      setError(getErrorMessage(err, t("booking.couldNotRecord")));
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
        <span className="pay-title">{t("booking.payments")}</span>
        <span className="muted">
          {t("booking.paidOf", { paid, total: booking.totalPrice })}
        </span>
      </div>

      {error && <p className="error-text">{error}</p>}

      {payments.length > 0 && (
        <ul className="pay-list">
          {payments.map((p) => (
            <li key={p.id} className="pay-row">
              <span className="pay-amount">{p.amount} {t("common.jod")}</span>
              <span className="muted">
                {t(`paymentMethod.${p.method}`, { defaultValue: p.method })} · {formatDay(p.createdAt.slice(0, 10))}
              </span>
              <span className={`badge badge-${p.status.toLowerCase()}`}>
                {t(`status.${p.status.toLowerCase()}`, { defaultValue: p.status })}
              </span>

              {side === "owner" && p.status === "Pending" && (
                <span className="pay-actions">
                  <button
                    type="button" disabled={busyId === p.id}
                    onClick={() => decide(p.id, confirmPayment, t("booking.couldNotConfirmPayment"))}
                  >
                    {t("requests.confirm")}
                  </button>
                  <button
                    type="button" disabled={busyId === p.id}
                    onClick={() => decide(p.id, rejectPayment, t("booking.couldNotRejectPayment"))}
                  >
                    {t("admin.reject")}
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
                id="payAmount" aria-label={t("booking.amount")}
                className="input" type="number" min="1" step="1" required
                placeholder={t("booking.amountPlaceholder")}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); clearError("payAmount"); }}
              />
              <select
                className="input"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {METHODS.map((m) => <option key={m.value} value={m.value}>{t(m.key)}</option>)}
              </select>
            </div>

            <FieldError>{errors.payAmount}</FieldError>

            <input
              id="payNote" aria-label={t("booking.reference")}
              className="input" maxLength={250}
              placeholder={t("booking.referencePlaceholder")}
              value={note}
              onChange={(e) => { setNote(e.target.value); clearError("payNote"); }}
            />
            <FieldError>{errors.payNote}</FieldError>

            <div className="booking-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? t("booking.recording") : t("booking.recordPayment")}
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
