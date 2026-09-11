import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMySubscription } from "../api/subscription";
import { createSubscriptionPayment, getMyPayments } from "../api/payments";
import { getErrorMessage } from "../api/errors";
import { Trans, useTranslation } from "react-i18next";
import { useToast } from "../context/ToastContext";
import { useSubscription } from "../context/SubscriptionContext";
import { formatDay } from "../utils/date";
import FieldError from "../components/FieldError";
import CardPreview from "../components/CardPreview";

/**
 * Values are Domain/Enums/PaymentMethod.cs.
 *
 * Cash is deliberately absent. It is a perfectly good way to settle a booking,
 * where two people meet and one hands the other money — but there is nobody to
 * hand cash to for a subscription, so offering it only produced payments an
 * administrator could never verify. Booking payments keep it.
 */
const METHODS = [
  { value: 4, key: "paymentMethod.Card", instant: true },
  { value: 2, key: "paymentMethod.CliQ" },
  { value: 3, key: "paymentMethod.BankTransfer" },
];

/**
 * Where a manual payment actually goes. Frontend configuration, the same way
 * Contact.jsx holds the support address — there is no endpoint serving these,
 * so edit them here.
 */
const PAY_TO = {
  cliqAlias: "BEYTAK",
  bank: "Arab Bank",
  accountName: "Beytak",
  iban: "JO94 ARAB 0000 0000 0000 1234 5678",
};

const digits = (s) => s.replace(/\D/g, "");

/** Groups a card number in fours as it is typed. */
const groupCard = (s) => digits(s).slice(0, 19).replace(/(.{4})/g, "$1 ").trim();

/**
 * The check every card issuer's numbers satisfy. It catches a mistyped digit,
 * which is the whole reason to validate here — it says nothing about whether a
 * card exists or has money behind it.
 */
function luhnOk(value) {
  const n = digits(value);
  if (n.length < 13) return false;
  let sum = 0;
  let double = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function expiryOk(value) {
  const m = value.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return false;
  const end = new Date(2000 + Number(m[2]), month, 0);
  return end >= new Date(new Date().toDateString());
}

export default function Subscribe() {
  const [sub, setSub] = useState(null);
  const [pending, setPending] = useState(null);
  const [method, setMethod] = useState(4);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const toast = useToast();
  const { refresh: refreshSubscription } = useSubscription();
  const { t } = useTranslation();

  // Card details live here and nowhere else. Nothing on this object is sent to
  // the API — only the last four digits travel, as a reference an
  // administrator can match against a statement.
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [cardErrors, setCardErrors] = useState({});
  const [cardFlipped, setCardFlipped] = useState(false);

  const chosen = METHODS.find((m) => m.value === Number(method));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setCardField(field, value) {
    setCard((c) => ({ ...c, [field]: value }));
    setCardErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function validateCard() {
    const found = {};
    if (!luhnOk(card.number)) found.number = t("subscribe.cardNumberInvalid");
    if (!card.name.trim()) found.name = t("subscribe.cardNameRequired");
    if (!expiryOk(card.expiry)) found.expiry = t("subscribe.cardExpiryInvalid");
    if (digits(card.cvc).length < 3) found.cvc = t("subscribe.cardCvcInvalid");
    setCardErrors(found);
    return Object.keys(found).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const isCard = Number(method) === 4;
    if (isCard && !validateCard()) return;

    setBusy(true);
    try {
      // Only the last four digits leave the browser. The number, the name and
      // the security code are never sent anywhere and are dropped from state
      // the moment this resolves.
      const reference = isCard
        ? t("subscribe.cardReference", { last4: digits(card.number).slice(-4) })
        : note.trim() || null;

      const created = await createSubscriptionPayment({
        method: Number(method),
        referenceNote: reference,
      });

      setCard({ number: "", name: "", expiry: "", cvc: "" });
      setCardFlipped(false);
      setNote("");

      // Driven by what the API returns rather than by which button was pressed,
      // so if the server ever confirms a card payment on the spot this screen
      // reports it correctly without another change here.
      setDone(created.status === "Confirmed" ? "instant" : "pending");
      toast.success(created.status === "Confirmed"
        ? t("subscribe.activated")
        : t("subscribe.recordedNote"));

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
    <div className="container section sub-page">
      <h1 className="page-title">{t("subscribe.title")}</h1>
      <p className="muted page-sub">
        <Trans i18nKey="subscribe.sub" values={{ price: sub.pricePerMonth }}>
          <strong />
        </Trans>
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
            {t("subscribe.pendingDetail", {
              amount: pending.amount,
              date: formatDay(pending.createdAt.slice(0, 10)),
            })}
          </p>
          <p className="field-hint">{t("subscribe.pendingNotify")}</p>
        </div>
      ) : (
        <form className="listing-form" onSubmit={handleSubmit} noValidate>
          <fieldset className="form-block">
            <legend>{sub.isActive ? t("subscribe.renew") : t("subscribe.subscribe")}</legend>
            <p className="form-block-hint">
              {t("subscribe.intro", { price: sub.pricePerMonth })}
              {sub.isActive && ` ${t("subscribe.renewEarly")}`}
            </p>

            {/* A segmented choice rather than a dropdown: there are three of
                them, they behave differently from one another, and the panel
                below changes with the answer. A select hides all of that
                behind a closed list. */}
            <div className="pay-methods" role="radiogroup" aria-label={t("subscribe.howDidYouPay")}>
              {METHODS.map((m) => (
                <label key={m.value} className={Number(method) === m.value ? "pay-method selected" : "pay-method"}>
                  <input
                    type="radio" name="method" value={m.value}
                    checked={Number(method) === m.value}
                    onChange={(e) => setMethod(Number(e.target.value))}
                  />
                  <span className="pay-method-name">{t(m.key)}</span>
                  <span className="pay-method-note">
                    {m.instant ? t("subscribe.methodInstant") : t("subscribe.methodManual")}
                  </span>
                </label>
              ))}
            </div>

            {chosen?.instant ? (
              <div className="card-panel">
                {/* Said plainly and up front. A form that looks like a real
                    checkout, in a project with no payment gateway behind it,
                    has to say what it is — and what it does not keep. */}
                <p className="notice card-demo-notice">{t("subscribe.cardDemo")}</p>
                <CardPreview
                  number={card.number}
                  name={card.name}
                  expiry={card.expiry}
                  cvc={card.cvc}
                  flipped={cardFlipped}
                />

                <div className="field">
                  <label className="label" htmlFor="cardNumber">{t("subscribe.cardNumber")}</label>
                  <input
                    id="cardNumber" className="input ltr" inputMode="numeric" autoComplete="off"
                    placeholder="4242 4242 4242 4242"
                    value={card.number}
                    onChange={(e) => setCardField("number", groupCard(e.target.value))}
                  />
                  <FieldError>{cardErrors.number}</FieldError>
                </div>

                <div className="field">
                  <label className="label" htmlFor="cardName">{t("subscribe.cardName")}</label>
                  <input
                    id="cardName" className="input" maxLength={80} autoComplete="off"
                    value={card.name}
                    onChange={(e) => setCardField("name", e.target.value)}
                  />
                  <FieldError>{cardErrors.name}</FieldError>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label className="label" htmlFor="cardExpiry">{t("subscribe.cardExpiry")}</label>
                    <input
                      id="cardExpiry" className="input ltr" inputMode="numeric" autoComplete="off"
                      placeholder="MM/YY" maxLength={5}
                      value={card.expiry}
                      onChange={(e) => {
                        const d = digits(e.target.value).slice(0, 4);
                        setCardField("expiry", d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                      }}
                    />
                    <FieldError>{cardErrors.expiry}</FieldError>
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="cardCvc">{t("subscribe.cardCvc")}</label>
                    <input
                      id="cardCvc" className="input ltr" inputMode="numeric" autoComplete="off"
                      maxLength={4} placeholder="123"
                      value={card.cvc}
                      onChange={(e) => setCardField("cvc", digits(e.target.value).slice(0, 4))}
                      onFocus={() => setCardFlipped(true)}
                      onBlur={() => setCardFlipped(false)}
                    />
                    <FieldError>{cardErrors.cvc}</FieldError>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-panel">
                {/* Where the money actually goes. Without these the instruction
                    "pay by CliQ" is not an instruction. */}
                <p className="form-block-hint" style={{ marginTop: 0 }}>
                  {t("subscribe.manualIntro", { price: sub.pricePerMonth })}
                </p>

                <dl className="pay-to">
                  {Number(method) === 2 ? (
                    <div>
                      <dt>{t("subscribe.cliqAlias")}</dt>
                      <dd className="ltr">{PAY_TO.cliqAlias}</dd>
                    </div>
                  ) : (
                    <>
                      <div>
                        <dt>{t("subscribe.bankName")}</dt>
                        <dd>{PAY_TO.bank}</dd>
                      </div>
                      <div>
                        <dt>{t("subscribe.accountName")}</dt>
                        <dd className="ltr">{PAY_TO.accountName}</dd>
                      </div>
                      <div>
                        <dt>{t("subscribe.iban")}</dt>
                        <dd className="ltr">{PAY_TO.iban}</dd>
                      </div>
                    </>
                  )}
                  <div>
                    <dt>{t("subscribe.amount")}</dt>
                    <dd><strong>{sub.pricePerMonth} {t("common.jod")}</strong></dd>
                  </div>
                </dl>

                <div className="field">
                  <label className="label" htmlFor="note">
                    {t("subscribe.reference")} <span className="optional">{t("listing.optional")}</span>
                  </label>
                  <input
                    id="note" className="input" maxLength={250}
                    placeholder={t("subscribe.referencePlaceholder")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <p className="field-hint">{t("subscribe.referenceHint")}</p>
                </div>
              </div>
            )}

            {done === "pending" && <p className="notice">{t("subscribe.waitingConfirmation")}</p>}
            {done === "instant" && <p className="notice notice-good">{t("subscribe.activated")}</p>}

            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy
                ? t("subscribe.recording")
                : chosen?.instant
                  ? t("subscribe.payNow", { amount: sub.pricePerMonth })
                  : t("subscribe.recordPayment", { amount: sub.pricePerMonth })}
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
