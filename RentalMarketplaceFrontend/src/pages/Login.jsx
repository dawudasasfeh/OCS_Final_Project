import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/errors";
import { useToast } from "../context/ToastContext";

// Development convenience only — the block that renders these is wrapped in
// import.meta.env.DEV, so Vite strips it from a production build.
//
// These mirror seed-data.json. Each one is here because it puts the app in a
// state worth looking at, not just because it can log in — between them they
// cover both sides of the subscription gate and every moderation queue.
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@beytak.com", password: "Admin123!",
    hint: "Moderation queues: 4 pending listings, 2 testimonials, 2 subscriptions" },
  { label: "Owner", email: "layla.haddad@gmail.com", password: "Test123!",
    hint: "Subscribed · 5 listings · can create a new one" },
  { label: "Owner (lapsed)", email: "ziad.khatib@yahoo.com", password: "Test123!",
    hint: "Subscription expired a month ago · blocked from listing · 3 listings" },
  { label: "Owner (no sub)", email: "hakam.zoubi@gmail.com", password: "Test123!",
    hint: "Never subscribed · payment still pending admin confirmation · 3 listings" },
  { label: "Renter", email: "yazan.husseini@gmail.com", password: "Test123!",
    hint: "3 bookings incl. a 35,000 JOD villa · 3 saved properties" },
  { label: "Renter 2", email: "lina.sawalha@outlook.com", password: "Test123!",
    hint: "4 bookings across weekly, monthly and cancelled · 2 saved" },
];

export default function Login() {
  const toast = useToast();
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
    setBusy(true);

    try {
      await login(email, password);
      navigate(returnTo, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, "Invalid email or password.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Welcome back</h1>
        <p className="muted" style={{ marginBottom: "1.4rem" }}>
          Log in to manage your listings and bookings.
        </p>

        {error && <p className="error-text">{error}</p>}

        {import.meta.env.DEV && (
          <div className="quick-cred">
            <span className="quick-cred-label">Demo accounts</span>
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

        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>

        <p className="auth-foot">
          No account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
