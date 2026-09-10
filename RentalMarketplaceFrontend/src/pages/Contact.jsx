import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createTestimonial } from "../api/testimonials";
import { getErrorMessage } from "../api/errors";
import { useToast } from "../context/ToastContext";
import { useFieldErrors } from "../utils/validation";
import FieldError from "../components/FieldError";
import { useTranslation } from "react-i18next";

// Address and hours are translated; the email and phone are literals that must
// not be, since they are what a reader copies or dials.
const DETAILS = [
  { icon: "✉", labelKey: "contact.email", value: "support@beytak.jo", href: "mailto:support@beytak.jo" },
  { icon: "☎", labelKey: "contact.phone", value: "+962 7 9000 0000", href: "tel:+962790000000" },
  { icon: "⌂", labelKey: "contact.office", valueKey: "contact.officeValue" },
  { icon: "◷", labelKey: "contact.hours", valueKey: "contact.hoursValue" },
];

const MIN = 20;
const MAX = 1000;

export default function Contact() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const toast = useToast();
  const { errors, validate, clearError, setFieldError } = useFieldErrors();
  const [content, setContent] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!validate(e.currentTarget)) return;

    const text = content.trim();
    if (text.length < MIN) {
      setFieldError("content", `Please write at least ${MIN} characters.`);
      return;
    }

    setBusy(true);
    try {
      await createTestimonial(text);
      setContent("");
      setSent(true);
      toast.success("Thank you. Your testimonial is waiting for review.");
    } catch (err) {
      const message = getErrorMessage(err, "Could not submit your testimonial. Please try again.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>{t("contact.title")}</h1>
          <p>
            {t("contact.intro")}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">

          {/* ── Testimonial form ─────────────────────────────── */}
          <div className="contact-panel">
            <h2>{t("contact.shareExperience")}</h2>
            <p className="muted" style={{ fontSize: ".88rem", marginBottom: "1.1rem" }}>
              {t("contact.shareIntro")}
            </p>

            {!user ? (
              <div className="auth-prompt">
                <p style={{ margin: "0 0 .9rem" }}>
                  {t("contact.needAccount")}
                </p>
                <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                  <Link to="/login" className="btn btn-primary">{t("nav.login")}</Link>
                  <Link to="/register" className="btn btn-outline">{t("footer.createAccount")}</Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {sent && (
                  <p className="notice">
                    {t("contact.submitted")}
                  </p>
                )}
                {error && <p className="error-text">{error}</p>}

                <div className="field">
                  <label className="label" htmlFor="content">{t("contact.yourTestimonial")}</label>
                  <textarea
                    id="content"
                    className="input"
                    rows={7}
                    style={{ resize: "vertical" }}
                    maxLength={MAX}
                    placeholder={t("contact.testimonialPlaceholder")}
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setSent(false); clearError("content"); }}
                    required
                  />
                  <span className="char-count">{content.length} / {MAX}</span>
                  <FieldError>{errors.content}</FieldError>
                </div>

                <p className="muted" style={{ fontSize: ".82rem" }}>
                  Posting as <strong>{user.name}</strong>.
                </p>

                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? t("contact.submitting") : t("contact.submit")}
                </button>
              </form>
            )}
          </div>

          {/* ── Contact details ──────────────────────────────── */}
          <aside className="contact-panel">
            <h2>{t("contact.getInTouch")}</h2>

            {DETAILS.map((d) => (
              <div className="contact-item" key={d.labelKey}>
                <span className="contact-icon" aria-hidden="true">{d.icon}</span>
                <div>
                  <div className="contact-item-label">{t(d.labelKey)}</div>
                  <div className="contact-item-value">
                    {d.href ? <a href={d.href} className="ltr">{d.value}</a> : t(d.valueKey)}
                  </div>
                </div>
              </div>
            ))}
          </aside>

        </div>
      </section>
    </>
  );
}
