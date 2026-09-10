import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/errors";
import { useTranslation } from "react-i18next";
import { useFieldErrors } from "../utils/validation";
import FieldError from "../components/FieldError";
import AuthLayout from "../components/AuthLayout";
import Logo from "../components/Logo";

const EMPTY = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const { t } = useTranslation();
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
      setFieldError("confirmPassword", t("validation.passwordsDiffer"));
      return;
    }

    setBusy(true);

    try {
      const { confirmPassword, ...dto } = form;
      await register(dto);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, t("auth.registrationFailed")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={t("auth.asideRegister")}
      points={t("auth.asideRegisterPoints", { returnObjects: true })}
    >
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
          <Link to="/" aria-label={t("nav.homeAria")}>
            <Logo size={105} variant="full" />
          </Link>
        </div>
        <h1>{t("auth.createTitle")}</h1>
        <p className="muted auth-sub">
          {t("auth.createSub")}
        </p>

        {error && <p className="error-text">{error}</p>}

        {/* Name and phone share a row, as the passwords do. Five stacked
            fields pushed the submit button past the fold; three rows keep the
            whole form on one screen. */}
        <div className="auth-row">
          <div className="field">
            <label className="label" htmlFor="fullName">{t("auth.fullName")}</label>
            <input
              id="fullName"
              name="fullName"
              className="input"
              autoComplete="name"
              placeholder={t("auth.namePlaceholder")}
              maxLength={100}
              value={form.fullName}
              onChange={update}
              required
            />
            <FieldError>{errors.fullName}</FieldError>
          </div>

          <div className="field">
            <label className="label" htmlFor="phoneNumber">{t("auth.phone")}</label>
            {/* type="tel" validates nothing on its own — it only hints at a
                phone keypad on mobile. Jordanian mobiles are ten digits
                beginning 077, 078 or 079, so the pattern is what refuses a
                bad one. */}
            <input
              id="phoneNumber"
              name="phoneNumber"
              className="input"
              type="tel"
              autoComplete="tel"
              placeholder={t("auth.phonePlaceholder")}
              pattern="07[789][0-9]{7}"
              title={t("auth.phoneTitle")}
              maxLength={10}
              value={form.phoneNumber}
              onChange={update}
              required
            />
            <FieldError>{errors.phoneNumber}</FieldError>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="email">{t("auth.email")}</label>
          <input
            id="email"
            name="email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            value={form.email}
            onChange={update}
            required
          />
          <FieldError>{errors.email}</FieldError>
        </div>

        <div className="auth-row">
          <div className="field">
            <label className="label" htmlFor="password">{t("auth.password")}</label>
            <input
              id="password"
              name="password"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder={t("auth.minChars")}
              minLength={6}
              pattern=".{6,}"
              title={t("auth.minChars")}
              value={form.password}
              onChange={update}
              required
            />
            <FieldError>{errors.password}</FieldError>
          </div>

          <div className="field">
            <label className="label" htmlFor="confirmPassword">{t("auth.confirmPassword")}</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder={t("auth.confirmPlaceholder")}
              value={form.confirmPassword}
              onChange={update}
              required
            />
            <FieldError>{errors.confirmPassword}</FieldError>
          </div>
        </div>

        <p className="auth-hint">
          {t("auth.passwordHint")}
        </p>

        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
          {busy ? t("auth.creatingAccount") : t("auth.createAccount")}
        </button>

        <p className="auth-foot">
          {t("auth.alreadyRegistered")} <Link to="/login">{t("auth.logInInstead")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
