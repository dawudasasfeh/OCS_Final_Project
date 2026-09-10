import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <section className="section">
      <div className="container notfound">
        <p className="notfound-code">404</p>
        <h1>{t("notFound.title")}</h1>
        <p className="muted">
          {t("notFound.sub")}
        </p>
        <div className="notfound-actions">
          <Link to="/houses" className="btn btn-primary">{t("notFound.browse")}</Link>
          <Link to="/" className="btn btn-outline">{t("notFound.goHome")}</Link>
        </div>
      </div>
    </section>
  );
}
