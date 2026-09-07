import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/errors";
import { useFieldErrors } from "../utils/validation";
import FieldError from "../components/FieldError";

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
  const { errors, validate, clearError, setFieldError } = useFieldErrors();

  const { register } = useAuth();
  const navigate = useNavigate();

  function update(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!validate(e.currentTarget)) return;

    if (form.password !== form.confirmPassword) {
      setFieldError("confirmPassword", "The two passwords do not match.");
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
          <FieldError>{errors.fullName}</FieldError>
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
          <FieldError>{errors.email}</FieldError>
        </div>

        <div className="field">
          <label className="label" htmlFor="phoneNumber">Phone number</label>
          {/* type="tel" validates nothing on its own — it only hints at a phone
              keypad on mobile. Jordanian mobiles are ten digits beginning 077,
              078 or 079, so the pattern is what actually refuses a bad one. */}
          <input
            id="phoneNumber"
            name="phoneNumber"
            className="input"
            type="tel"
            autoComplete="tel"
            placeholder="0790000000"
            pattern="07[789][0-9]{7}"
            title="A Jordanian mobile number: ten digits starting 077, 078 or 079."
            maxLength={10}
            value={form.phoneNumber}
            onChange={update}
            required
          />
          <FieldError>{errors.phoneNumber}</FieldError>
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
              pattern=".{6,}"
              title="At least 6 characters."
              value={form.password}
              onChange={update}
              required
            />
            <FieldError>{errors.password}</FieldError>
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
            <FieldError>{errors.confirmPassword}</FieldError>
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
