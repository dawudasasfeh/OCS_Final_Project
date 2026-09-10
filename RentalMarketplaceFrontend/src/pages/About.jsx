import { Link } from "react-router-dom";
import ListPropertyLink from "../components/ListPropertyLink";
import { useTranslation } from "react-i18next";

/* Only the non-text parts live here now — the numbers a marker could check,
   the images and the query strings. Every label and paragraph moved into the
   translation files, so About reads the same way in both languages. */
const STAT_VALUES = ["12", "0%", "3", "20 JOD"];

const REGION_META = [
  { img: "/about/amman-apartments.jpg", link: "/houses?city=Amman" },
  { img: "/about/salt-heritage.jpg", link: "/houses?city=Salt" },
  { img: "/about/aqaba-coastal.jpg", link: "/houses?city=Aqaba" },
];

export default function About() {
  const { t } = useTranslation();

  const steps = t("about.steps", { returnObjects: true });
  const guarantees = t("about.guarantees", { returnObjects: true });
  const statLabels = t("about.stats", { returnObjects: true });
  const regions = t("about.regions", { returnObjects: true });

  return (
    <>
      {/* 1 ── Header ─────────────────────────────────────────────── */}
      <section className="page-head">
        <div className="container">
          <h1>{t("about.title")}</h1>
          <p>
            {t("about.intro")}
          </p>
        </div>
      </section>

      {/* 2 ── Why it exists ──────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="about-hero-grid">
            <div>
              <h2>{t("about.whyTitle")}</h2>

              <p className="muted">
                {t("about.whyP1")}
              </p>

              <p className="muted">
                {t("about.whyP2")}
              </p>

              <div className="about-pills">
                <span className="about-pill"><span className="dot" /> {t("about.pillNoCommission")}</span>
                <span className="about-pill"><span className="dot" /> {t("about.pillDirect")}</span>
                <span className="about-pill"><span className="dot" /> {t("about.pillServerDates")}</span>
                <span className="about-pill"><span className="dot" /> {t("about.pillCash")}</span>
              </div>

              <Link to="/houses" className="btn btn-primary">
                {t("about.browse")}
              </Link>
            </div>

            <div className="about-img-frame">
              <img
                src="/about/amman-living.jpg"
                alt={t("about.imgAlt")}
              />
              <div className="about-img-badge">
                <strong>{t("about.badgeTitle")}</strong>
                {t("about.badgeText")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 ── How it works ───────────────────────────────────────── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>{t("about.howTitle")}</h2>
            <p className="muted">{t("about.howSub")}</p>
          </div>

          <div className="grid-features">
            {steps.map((step, i) => (
              <div className="feature" key={step.h}>
                <div className="feature-num">{i + 1}</div>
                <h3>{step.h}</h3>
                <p>{step.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 ── What the platform guarantees ───────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("about.guaranteesTitle")}</h2>
            <p className="muted">
              {t("about.guaranteesSub")}
            </p>
          </div>

          <div className="values-grid">
            {guarantees.map((g, i) => (
              <div className="value-card" key={g.h}>
                {/* A numeral rather than an emoji: emoji render as flat
                    dingbats on Windows and coloured art on phones, so the same
                    card looked like two different designs. */}
                <div className="value-icon">{String(i + 1).padStart(2, "0")}</div>
                <h3>{g.h}</h3>
                <p>{g.p}</p>
              </div>
            ))}
          </div>

          <div className="grid-stats about-stats">
            {STAT_VALUES.map((value, i) => (
              <div className="stat" key={value}>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{statLabels[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 ── Where you can rent ─────────────────────────────────── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>{t("about.regionsTitle")}</h2>
            <p className="muted">
              {t("about.regionsSub")}
            </p>
          </div>

          <div className="about-cities-grid">
            {regions.map((r, i) => (
              <article className="city-card" key={r.city}>
                <div className="city-card-thumb">
                  <img src={REGION_META[i].img} alt={t("about.regionAlt", { city: r.city })} />
                  <span className="city-card-tag">{r.tag}</span>
                </div>
                <div className="city-card-body">
                  <h3>{r.city}</h3>
                  <p>{r.desc}</p>
                  <Link to={REGION_META[i].link} className="city-card-link">
                    {t("about.seePropertiesIn", { city: r.city })} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6 ── Close ──────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="about-banner">
            <h2>{t("about.closeTitle")}</h2>
            <p>
              {t("about.closeText")}
            </p>
            <div className="about-banner-actions">
              <Link to="/houses" className="btn btn-primary">{t("about.browse")}</Link>
              {/* The same gated component the navbar uses, so a signed-out
                  visitor is sent to sign in rather than bounced off a
                  protected route with no explanation. */}
              <ListPropertyLink className="btn btn-outline" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
