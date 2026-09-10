import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/errors";
import { useTranslation } from "react-i18next";
import { useToast } from "../context/ToastContext";
import { useFieldErrors } from "../utils/validation";
import FieldError from "../components/FieldError";
import AuthLayout from "../components/AuthLayout";
import Logo from "../components/Logo";

// Development convenience only — the block that renders these is wrapped in
// import.meta.env.DEV, so Vite strips it from a production build.
//
// Three accounts, one per side of the subscription gate. Layla owns listings
// and has bookings against her properties, so a single account covers both
// renting and owning; Hakam is the same minus an active subscription, which is
// what makes the paywall visible.
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@beytak.com", password: "Admin123!",
    hint: "Moderation queues: pending listings, testimonials and subscriptions" },
  { label: "User (sub)", email: "layla.haddad@gmail.com", password: "Test123!",
    hint: "Subscribed · 5 listings · can publish a new one" },
  { label: "User (unsub)", email: "hakam.zoubi@gmail.com", password: "Test123!",
    hint: "Never subscribed · blocked from listing · payment awaiting admin" },
];

export default function Login() {
  const { t } = useTranslation();
  const toast = useToast();
  const { errors, validate, clearError } = useFieldErrors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Only same-site paths are honoured, so ?returnTo=https://evil.example
  // cannot turn the login page into an open redirect.
  const raw = params.get("returnTo") ?? "";
  const returnTo = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!validate(e.currentTarget)) return;

    setBusy(true);

    try {
      await login(email, password);
      navigate(returnTo, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, t("auth.invalidCredentials"));
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={t("auth.asideLogin")}
      points={t("auth.asideLoginPoints", { returnObjects: true })}
    >
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
          <Link to="/" aria-label={t("nav.homeAria")}>
            <Logo size={105} variant="full" />
          </Link>
        </div>
        <h1>{t("auth.welcomeBack")}</h1>
        <p className="muted auth-sub">
          {t("auth.loginSub")}
        </p>

        {error && <p className="error-text">{error}</p>}

        <div className="field">
          <label className="label" htmlFor="email">{t("auth.email")}</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
            required
          />
          <FieldError>{errors.email}</FieldError>
        </div>

        <div className="field">
          <label className="label" htmlFor="password">{t("auth.password")}</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder={t("auth.passwordPlaceholder")}
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
            required
          />
          <FieldError>{errors.password}</FieldError>
        </div>

        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
          {busy ? t("auth.loggingIn") : t("auth.logIn")}
        </button>

        <p className="auth-foot">
          {t("auth.noAccount")} <Link to="/register">{t("auth.createOne")}</Link>
        </p>

        {/* Below the form, not above it. Six buttons ahead of the email field
            made the shortcut the first thing on the page — and it is stripped
            from a production build entirely, so it should never lead. */}
        {import.meta.env.DEV && (
          <div className="quick-cred">
            <span className="quick-cred-label">{t("auth.demoAccounts")}</span>
            <div className="quick-cred-row">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  className="quick-cred-btn"
                  title={`${a.email} — ${a.hint}`}
                  onClick={() => { setEmail(a.email); setPassword(a.password); }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
