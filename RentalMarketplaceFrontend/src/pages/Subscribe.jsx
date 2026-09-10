import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMySubscription } from "../api/subscription";
import { createSubscriptionPayment, getMyPayments } from "../api/payments";
import { getErrorMessage } from "../api/errors";
import { Trans, useTranslation } from "react-i18next";
import { useToast } from "../context/ToastContext";
import { useSubscription } from "../context/SubscriptionContext";
import { formatDay } from "../utils/date";

// Values are Domain/Enums/PaymentMethod.cs.
const METHODS = [
  { value: 1, key: "paymentMethod.Cash" },
  { value: 2, key: "paymentMethod.CliQ" },
  { value: 3, key: "paymentMethod.BankTransfer" },
  { value: 4, key: "paymentMethod.Card" },
];

export default function Subscribe() {
  const [sub, setSub] = useState(null);
  const [pending, setPending] = useState(null);
  const [method, setMethod] = useState(2);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const toast = useToast();
  const { refresh: refreshSubscription } = useSubscription();
  const { t } = useTranslation();

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
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err, t("subscribe.couldNotLoad"))); })
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
      toast.success(t("subscribe.recordedNote"));
      // The gate reads the API, so ask again in case this completed the flow.
      refreshSubscription();
      await load();
    } catch (err) {
      const message = getErrorMessage(err, t("subscribe.couldNotRecord"));
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (!sub) {
    return (
      <div className="container section">
        {error ? <p className="error-text">{error}</p> : <p className="muted">{t("common.loading")}</p>}
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="page-title">{t("subscribe.title")}</h1>
      <p className="muted page-sub">
        Owners need an active subscription to publish a listing. It costs{" "}
        <strong>{sub.pricePerMonth} JOD</strong> per month.
      </p>

      {error && <p className="error-text">{error}</p>}

      <div className="sub-status">
        <span className={`badge badge-${sub.isActive ? "approved" : "rejected"}`}>
          {sub.isActive ? t("status.active") : t("status.notActive")}
        </span>
        {sub.isActive ? (
          <p className="muted">
            <Trans i18nKey="subscribe.runsUntil" values={{ date: formatDay(sub.expiresAt) }}>
              <strong />
            </Trans>{" "}
            {t("subscribe.daysLeft", { count: sub.daysRemaining })}{" "}
            <Link to="/houses/new">{t("nav.listProperty")}</Link>.
          </p>
        ) : (
          <p className="muted">{t("subscribe.cannotPublish")}</p>
        )}
      </div>

      {pending ? (
        <div className="form-block sub-pending">
          <p className="booking-done-title">{t("subscribe.recorded")}</p>
          <p className="muted">
            {pending.amount} JOD, recorded {formatDay(pending.createdAt.slice(0, 10))}.
            An administrator will confirm it, and your subscription starts then.
          </p>
        </div>
      ) : (
        <form className="listing-form" onSubmit={handleSubmit}>
          <fieldset className="form-block">
            <legend>{sub.isActive ? t("subscribe.renew") : t("subscribe.subscribe")}</legend>

            <p className="field-hint" style={{ marginTop: 0 }}>
              Pay {sub.pricePerMonth} JOD by whichever method suits you, then record
              it here. Beytak does not handle the money — an administrator checks
              that it arrived.
              {sub.isActive && " Renewing early adds a month to your current expiry."}
            </p>

            <div className="field">
              <label className="label" htmlFor="method">{t("subscribe.howDidYouPay")}</label>
              <select
                id="method" className="input"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{t(m.key)}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="note">
                Reference <span className="optional">optional</span>
              </label>
              <input
                id="note" className="input" maxLength={250}
                placeholder={t("subscribe.referencePlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <p className="field-hint">
                Anything that helps the administrator match your payment.
              </p>
            </div>

            {sent && <p className="notice">{t("subscribe.waitingConfirmation")}</p>}

            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? t("subscribe.recording") : t("subscribe.recordPayment", { amount: sub.pricePerMonth })}
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
