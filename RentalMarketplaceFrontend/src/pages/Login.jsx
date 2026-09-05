import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/errors";

// Development convenience only — the block that renders these is wrapped in
// import.meta.env.DEV, so Vite strips it from a production build.
const DEMO_ACCOUNTS = [
  { label: "Renter", email: "renter01@test.com", password: "Test123!" },
  { label: "Owner", email: "dawud@test.com", password: "Test123!" },
  { label: "Admin", email: "admin@beytak.com", password: "Admin123!" },
];

export default function Login() {
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
      setError(getErrorMessage(err, "Invalid email or password."));
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
