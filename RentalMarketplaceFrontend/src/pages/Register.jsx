import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/errors";

const EMPTY = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  function update(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const { confirmPassword, ...dto } = form;
      await register(dto);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Create your account</h1>
        <p className="muted" style={{ marginBottom: "1.4rem" }}>
          One account to rent a home or list your own.
        </p>

        {error && <p className="error-text">{error}</p>}

        <div className="field">
          <label className="label" htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            name="fullName"
            className="input"
            autoComplete="name"
            placeholder="Dawud Asasfeh"
            maxLength={100}
            value={form.fullName}
            onChange={update}
            required
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update}
            required
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="phoneNumber">Phone number</label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            className="input"
            type="tel"
            autoComplete="tel"
            placeholder="079 000 0000"
            value={form.phoneNumber}
            onChange={update}
            required
          />
        </div>

        <div className="auth-row">
          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              minLength={6}
              value={form.password}
              onChange={update}
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat it"
              value={form.confirmPassword}
              onChange={update}
              required
            />
          </div>
        </div>

        <p className="auth-hint">
          Use at least 6 characters with an uppercase letter, a number and a symbol.
        </p>

        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>

        <p className="auth-foot">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
