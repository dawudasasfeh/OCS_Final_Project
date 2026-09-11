import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ListPropertyLink from "../components/ListPropertyLink";
import { getCityCounts } from "../api/houses";
import { IconArrow } from "../components/icons";
import { useTranslation } from "react-i18next";

/**
 * The page used to make four points and state each of them three times: a row
 * of pills, then four "how it works" steps, then four "guarantees" that were
 * the same four steps re-worded, then a stat strip repeating two of them again.
 * Twelve cards for four ideas, which is why it read as noise rather than as an
 * argument. The steps and the guarantees are now one set of four — each step
 * says what you do and what the system promises while you do it.
 *
 * Keyed by city name, not by array position. The old version joined
 * REGION_META[i] to the translated regions[i], so adding a city to one file and
 * forgetting the other threw on undefined.img.
 */
const REGIONS = [
  { city: "Amman", img: "/about/amman-apartments.jpg" },
  { city: "Salt", img: "/about/salt-heritage.jpg" },
  { city: "Aqaba", img: "/about/aqaba-coastal.jpg" },
];

export default function About() {
  const { t } = useTranslation();
  const steps = t("about.steps", { returnObjects: true });

  // Real counts, not prose. The cards used to describe "Ottoman stone houses on
  // the slopes below the old town" for a city holding one listing, and the gap
  // between the promise and the click is what made the page feel hollow. A card
  // that admits it has one property is trustworthy; one that implies a
  // portfolio is not.
  const [counts, setCounts] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getCityCounts()
      .then((c) => { if (!cancelled) setCounts(c); })
      .catch(() => { if (!cancelled) setCounts({}); });
    return () => { cancelled = true; };
  }, []);

  const countLabel = (city) => {
    if (counts === null) return " ";            // no flicker before it lands
    const n = counts[city] ?? 0;
    return n === 0 ? t("about.regionEmpty") : t("about.regionCount", { count: n });
  };

  return (
    <>
      {/* 1 ── What this is ───────────────────────────────────────── */}
      <section className="page-head">
        <div className="container">
          <h1>{t("about.title")}</h1>
          <p>{t("about.intro")}</p>
        </div>
      </section>

      {/* 2 ── Why it exists ──────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="about-hero-grid">
            <div>
              <h2>{t("about.whyTitle")}</h2>
              <p className="muted">{t("about.whyP1")}</p>
              <p className="muted">{t("about.whyP2")}</p>

              <Link to="/houses" className="btn btn-primary">
                {t("about.browse")}
              </Link>
            </div>

            <div className="about-img-frame">
              <img
                src="/about/amman-living.jpg"
                alt={t("about.imgAlt")}
                width="1000" height="671"
              />
              <div className="about-img-badge">
                <strong>{t("about.badgeTitle")}</strong>
                {t("about.badgeText")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 ── How it works — the steps and the promises, together ── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>{t("about.howTitle")}</h2>
            <p className="muted">{t("about.howSub")}</p>
          </div>

          <ol className="steps-grid">
            {steps.map((step, i) => (
              <li className="step-card" key={step.h}>
                {/* A numeral rather than an emoji: emoji render as flat
                    dingbats on Windows and coloured art on phones, so the same
                    card looked like two different designs. */}
                <span className="step-num" aria-hidden="true">{i + 1}</span>
                <h3>{step.h}</h3>
                <p>{step.p}</p>
                <p className="step-promise">{step.promise}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4 ── Where you can rent ─────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("about.regionsTitle")}</h2>
            <p className="muted">{t("about.regionsSub")}</p>
          </div>

          <div className="about-cities-grid">
            {REGIONS.map(({ city, img }) => {
              const name = t(`city.${city}`, { defaultValue: city });
              return (
                <article className="city-card" key={city}>
                  <div className="city-card-thumb">
                    <img src={img} alt={t("about.regionAlt", { city: name })}
                         width="800" height="597" loading="lazy" />
                    <span className="city-card-tag">{t(`about.regions.${city}.tag`)}</span>
                  </div>
                  <div className="city-card-body">
                    <div className="city-card-head">
                      <h3>{name}</h3>
                      <span className="city-card-count">{countLabel(city)}</span>
                    </div>
                    <p>{t(`about.regions.${city}.desc`)}</p>
                    <Link to={`/houses?city=${encodeURIComponent(city)}`} className="city-card-link">
                      {t("about.seePropertiesIn", { city: name })} <IconArrow size={15} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5 ── Who built it ───────────────────────────────────────── */}
      {/* The page had no "about" in it — six sections of product marketing and
          not one line saying who made this or why. This is the section an
          About page exists for. */}
      <section className="section section-alt">
        <div className="container">
          <div className="about-credits">
            <div>
              <h2>{t("about.builtTitle")}</h2>
              <p className="muted">{t("about.builtP1")}</p>
              <p className="muted">{t("about.builtP2")}</p>
            </div>

            <dl className="about-facts">
              <div>
                <dt>{t("about.factStudent")}</dt>
                <dd>Dawud Asasfeh</dd>
              </div>
              <div>
                <dt>{t("about.factCourse")}</dt>
                <dd>{t("about.factCourseValue")}</dd>
              </div>
              <div>
                <dt>{t("about.factStack")}</dt>
                <dd className="ltr">
                  ASP.NET Core (.NET 10) · React 19 + Vite · SQL Server · EF Core
                </dd>
              </div>
              <div>
                <dt>{t("about.factSource")}</dt>
                <dd>
                  <a className="ltr" href="https://github.com/dawudasasfeh/OCS_Final_Project"
                     target="_blank" rel="noopener noreferrer">
                    github.com/dawudasasfeh
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* 6 ── Close ──────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="about-banner">
            <h2>{t("about.closeTitle")}</h2>
            <p>{t("about.closeText")}</p>
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
