import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DETAILS = [
  { icon: "✉", label: "Email", value: "support@beytak.jo", href: "mailto:support@beytak.jo" },
  { icon: "☎", label: "Phone", value: "+962 7 9000 0000", href: "tel:+962790000000" },
  { icon: "⌂", label: "Office", value: "Al Shmeisani, Amman, Jordan" },
  { icon: "◷", label: "Hours", value: "Sunday to Thursday, 9:00 – 17:00" },
];

const MIN = 20;
const MAX = 1000;

export default function Contact() {
  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const text = content.trim();
    if (text.length < MIN) {
      setError(`Please write at least ${MIN} characters.`);
      return;
    }

    setBusy(true);
    try {
      // TODO: await client.post("/testimonials", { content: text })
      console.log("Testimonial:", text);
      setContent("");
      setSent(true);
    } catch {
      setError("Could not submit your testimonial. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Contact us</h1>
          <p>
            Questions about a listing, a booking or your subscription? Reach us on the
            details below — or share your experience of using Beytak.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">

          {/* ── Testimonial form ─────────────────────────────── */}
          <div className="contact-panel">
            <h2>Share your experience</h2>
            <p className="muted" style={{ fontSize: ".88rem", marginBottom: "1.1rem" }}>
              Tell other renters and owners how Beytak worked for you. Testimonials are
              reviewed by our team before they appear on the site.
            </p>

            {!user ? (
              <div className="auth-prompt">
                <p style={{ margin: "0 0 .9rem" }}>
                  You need an account to leave a testimonial.
                </p>
                <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                  <Link to="/login" className="btn btn-primary">Log in</Link>
                  <Link to="/register" className="btn btn-outline">Create account</Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {sent && (
                  <p className="notice">
                    Thank you. Your testimonial has been submitted and will appear once
                    it is approved.
                  </p>
                )}
                {error && <p className="error-text">{error}</p>}

                <div className="field">
                  <label className="label" htmlFor="content">Your testimonial</label>
                  <textarea
                    id="content"
                    className="input"
                    rows={7}
                    style={{ resize: "vertical" }}
                    maxLength={MAX}
                    placeholder="What did you use Beytak for, and how did it go?"
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setSent(false); }}
                    required
                  />
                  <span className="char-count">{content.length} / {MAX}</span>
                </div>

                <p className="muted" style={{ fontSize: ".82rem" }}>
                  Posting as <strong>{user.name}</strong>.
                </p>

                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? "Submitting…" : "Submit testimonial"}
                </button>
              </form>
            )}
          </div>

          {/* ── Contact details ──────────────────────────────── */}
          <aside className="contact-panel">
            <h2>Get in touch</h2>

            {DETAILS.map((d) => (
              <div className="contact-item" key={d.label}>
                <span className="contact-icon" aria-hidden="true">{d.icon}</span>
                <div>
                  <div className="contact-item-label">{d.label}</div>
                  <div className="contact-item-value">
                    {d.href ? <a href={d.href}>{d.value}</a> : d.value}
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
