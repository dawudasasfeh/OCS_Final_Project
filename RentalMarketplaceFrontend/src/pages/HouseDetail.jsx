import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getHouse } from "../api/houses";
import { imageUrl } from "../utils/images";
import { formatDay } from "../utils/date";
import { getErrorMessage } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import WishlistButton from "../components/WishlistButton";
import BookingForm from "../components/BookingForm";
import { Trans, useTranslation } from "react-i18next";
import { IconPrev, IconNext, IconPhone, IconChat } from "../components/icons";


const initials = (name = "") =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const spaced = (s = "") => s.replace(/([a-z])([A-Z])/g, "$1 $2");

const reference = (id) => `BYT${String(id).padStart(6, "0")}`;

// Was a second, en-GB-only formatter. formatDay already follows the reading
// language, so the listing date matches every other date on the site.
const formatDate = (iso) => formatDay(String(iso).slice(0, 10));

export default function HouseDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();

  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [broken, setBroken] = useState(() => new Set());
  const stripRef = useRef(null);
  const [booking, setBooking] = useState(false);

  const markBroken = (i) => setBroken((prev) => new Set(prev).add(i));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getHouse(id);
        if (!cancelled) {
          setHouse(data);
          setActiveImage(0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.status === 404
              ? t("house.unavailable")
              : getErrorMessage(err, t("house.couldNotLoad"))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="container section">
        <p className="muted">{t("house.loading")}</p>
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="container section">
        <div className="empty-state">
          <p>{error || t("house.notFound")}</p>
          <Link to="/houses" className="btn btn-outline">{t("house.backToProperties")}</Link>
        </div>
      </div>
    );
  }

  const images = house.imageUrls ?? [];
  const isOwner = user?.id === house.ownerId;

  // ── Gallery navigation ──────────────────────────────────────────
  // Wraps at both ends. A gallery of five photographs is a loop, not a list
  // with a wall at each end, and a disabled arrow on the last photo just asks
  // the reader to travel back through all five.
  const rtl = i18n.dir() === "rtl";

  function showImage(i) {
    setActiveImage(i);
    // block: nearest keeps the page still — scrollIntoView on a thumbnail
    // will happily drag the whole document up to centre it otherwise.
    stripRef.current?.children[i]?.scrollIntoView({
      behavior: "smooth", block: "nearest", inline: "center",
    });
  }

  const step = (delta) => {
    if (images.length < 2) return;
    showImage((activeImage + delta + images.length) % images.length);
  };

  // Arrow keys, but only while the focus is inside the gallery: binding them
  // to the window would take the arrow keys away from scrolling the page.
  // In Arabic the right arrow means back, because that is the direction the
  // photographs are laid out in.
  function onGalleryKey(e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const forward = e.key === "ArrowRight" ? !rtl : rtl;
    step(forward ? 1 : -1);
  }

  // The API decides what this string is: a guest receives 079048XXXX,
  // a signed-in caller receives the whole number. Nothing is masked here.
  const phone = house.ownerPhone;

  // wa.me needs the number in international form with no punctuation: a local
  // 0790000000 becomes 962790000000. Only built for a signed-in caller — a
  // guest holds the masked number, and 079048XXXX would make a dead link.
  const whatsapp = user && phone && /^\d+$/.test(phone)
    ? `https://wa.me/962${phone.replace(/^0/, "")}?text=${encodeURIComponent(
        `Hello, I saw your listing "${house.title}" (ref BYT${String(house.id).padStart(6, "0")}) on Beytak and would like to ask about it.`
      )}`
    : null;

  // Ordered building-level first, then the property, then room counts —
  // the convention Jordanian listing sites use.
  // Optional fields are filtered out rather than shown as "—".
  // Enum values arrive from the API in PascalCase ("BankTransfer", "Monthly").
  // They are looked up by a lowercased key, falling back to the spaced English
  // so a value the translation files have not caught up with still reads.
  const enumLabel = (ns, value) =>
    value ? t(`${ns}.${String(value).charAt(0).toLowerCase() + String(value).slice(1)}`, { defaultValue: spaced(value) }) : value;

  const details = [
    [t("house.buildingAge"), house.buildingAge ? spaced(house.buildingAge) : null],
    [t("house.rentalPeriod"), enumLabel("period", house.priceUnit)],
    [t("house.propertyType"), enumLabel("propertyType", house.propertyType)],
    [t("house.floor"), house.floorNumber],
    [t("house.apartmentsInBuilding"), house.apartmentsInBuilding],
    [t("house.furnishing"), house.isFurnished ? t("houses.furnished") : t("houses.unfurnished")],
    [t("house.area"), t("common.sqm", { value: house.areaSqM })],
    [t("house.bedrooms"), house.bedrooms],
    [t("house.masterBedrooms"), house.masterBedrooms],
    [t("house.bathrooms"), house.bathrooms],
    [t("house.turnover"), t("house.turnoverDays", { count: house.turnoverDays })],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  const listingInfo = [
    [t("house.reference"), reference(house.id)],
    [t("house.listedOn"), formatDate(house.createdAt)],
    [t("house.location"), `${house.neighborhood ? house.neighborhood + ", " : ""}${t(`city.${house.city}`, { defaultValue: house.city })}`],
  ];

  return (
    <>
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/">{t("nav.home")}</Link>
          <span className="sep">›</span>
          <Link to="/houses">{t("nav.properties")}</Link>
          <span className="sep">›</span>
          <Link to={`/houses?city=${encodeURIComponent(house.city)}`}>{house.city}</Link>
          <span className="sep">›</span>
          <span className="current">{house.title}</span>
        </nav>

        {/* The stage carries the photograph and the strip under it carries the
            choice. It used to be a vertical rail beside a 400px pane, which
            gave the rail a whole column of the layout to show six thumbnails
            in — the photograph is the thing people came for, so it now takes
            the width and the thumbnails take a strip.

            onKeyDown sits on the wrapper rather than on each button so that a
            key pressed on a thumbnail, an arrow, or anywhere else inside the
            gallery reaches the same handler once, by bubbling. */}
        <div className="gallery" onKeyDown={onGalleryKey}>
          {images.length > 1 && (
            <div className="gallery-strip" ref={stripRef}>
              {images.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  className={i === activeImage ? "gallery-thumb active" : "gallery-thumb"}
                  onClick={() => showImage(i)}
                  aria-label={t("house.showImage", { n: i + 1 })}
                  aria-current={i === activeImage ? "true" : undefined}
                >
                  {broken.has(i)
                    ? <span>{i + 1}</span>
                    : <img src={imageUrl(url)} alt="" onError={() => markBroken(i)} />}
                </button>
              ))}
            </div>
          )}

          <div className="gallery-stage">
            {images.length === 0 || broken.has(activeImage) ? (
              <span className="gallery-empty">
                {images.length === 0 ? t("house.noImage") : t("house.photoUnavailable")}
              </span>
            ) : (
              <img
                src={imageUrl(images[activeImage])}
                alt={t("house.imageOf", { n: activeImage + 1, total: images.length, title: house.title })}
                onError={() => markBroken(activeImage)}
              />
            )}

            {/* Nothing to page through with one photograph, and two arrows
                that do nothing are worse than no arrows. */}
            {images.length > 1 && (
              <>
                <button
                  type="button" className="gallery-nav prev"
                  onClick={() => step(-1)}
                  aria-label={t("house.previousImage")}
                >
                  <IconPrev size={19} />
                </button>

                <button
                  type="button" className="gallery-nav next"
                  onClick={() => step(1)}
                  aria-label={t("house.nextImage")}
                >
                  <IconNext size={19} />
                </button>

                {/* Latin digits in both languages, like every other number on
                    the site. The strip below can be scrolled out of view; this
                    is the only thing that says how much is left. */}
                <span className="gallery-counter ltr">
                  {activeImage + 1} / {images.length}
                </span>
              </>
            )}
          </div>

        </div>
      </div>

      <div className="container section" style={{ paddingTop: 0 }}>
        <div className="detail-layout">

          <div>
            {house.status !== "Approved" && (
              <p className={house.status === "Rejected" ? "error-text" : "notice"}>
                <Trans
                  i18nKey="house.statusNotice"
                  values={{ status: t(`status.${house.status.toLowerCase()}`, { defaultValue: house.status }) }}
                >
                  <strong />
                </Trans>
              </p>
            )}

            <div className="detail-title-row">
              <h1 className="detail-title" dir="auto">{house.title}</h1>
              <WishlistButton
                houseId={house.id}
                ownerId={house.ownerId}
                className="wish-btn-lg"
              />
            </div>
            <p className="detail-location">
              {house.address}
              {house.neighborhood ? `, ${house.neighborhood}` : ""}, {house.city}
            </p>

            <div className="spec-bar">
              <div className="spec">
                <span className="spec-label">{t("house.bedrooms")}</span>
                <span className="spec-value">{house.bedrooms}</span>
              </div>
              <div className="spec">
                <span className="spec-label">{t("house.bathrooms")}</span>
                <span className="spec-value">{house.bathrooms}</span>
              </div>
              <div className="spec">
                <span className="spec-label">{t("house.area")}</span>
                <span className="spec-value">{t("common.sqm", { value: house.areaSqM })}</span>
              </div>
              <div className="spec">
                <span className="spec-label">{t("house.furnishing")}</span>
                <span className="spec-value">{house.isFurnished ? t("houses.furnished") : t("houses.unfurnished")}</span>
              </div>
              <div className="spec">
                <span className="spec-label">{t("house.type")}</span>
                <span className="spec-value">{spaced(house.propertyType)}</span>
              </div>
            </div>

            <div className="detail-block">
              <h2>{t("house.details")}</h2>
              <dl className="detail-table">
                {details.map(([label, value]) => (
                  <div className="detail-row" key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="detail-block">
              <h2>{t("house.description")}</h2>
              <p className="detail-description" dir="auto">{house.description}</p>
            </div>

            <div className="detail-block">
              <h2>{t("house.listingInformation")}</h2>
              <dl className="detail-table detail-table-meta">
                {listingInfo.map(([label, value]) => (
                  <div className="detail-row" key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <aside className="detail-aside">
            <div className="price-card">
              <div className="price-tag">
                {house.price} {t("common.jod")}{" "}
                <span>{t("card.perUnit", { unit: t(`period.${house.priceUnit.toLowerCase()}`, { defaultValue: house.priceUnit.toLowerCase() }) })}</span>
              </div>
              <p className="price-note">
                {house.isAvailable ? t("status.availableToBook") : t("status.currentlyUnavailable")}
              </p>

              {isOwner ? (
                <Link to="/my-listings" className="btn btn-outline phone-btn">
                  {t("house.manageListing")}
                </Link>
              ) : (
                <div className="action-stack">
                  {!phone ? (
                    <div className="phone-btn phone-empty">{t("house.noPhone")}</div>
                  ) : user ? (
                    <a href={`tel:${phone}`} className="btn btn-primary phone-btn">
                      <span className="phone-icon"><IconPhone size={20} /></span>
                      <span className="phone-text">
                        <strong>{phone}</strong>
                      </span>
                    </a>
                  ) : (
                    <Link
                      to={`/login?returnTo=/houses/${house.id}`}
                      className="btn btn-primary phone-btn"
                    >
                      <span className="phone-icon"><IconPhone size={20} /></span>
                      <span className="phone-text">
                        <strong>{phone}</strong>
                        <small>{t("house.signInForNumber")}</small>
                      </span>
                    </Link>
                  )}

                  {/* In Jordan most enquiries start on WhatsApp rather than a
                      call, and the prefilled message saves the owner asking
                      which listing this is about. */}
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      className="btn btn-whatsapp phone-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="phone-icon"><IconChat size={20} /></span>
                      <span className="phone-text"><strong>{t("house.chatWhatsapp")}</strong></span>
                    </a>
                  )}

                  {user ? (
                      booking ? (
                        <BookingForm key={house.id} house={house} />
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline phone-btn"
                          onClick={() => setBooking(true)}
                          disabled={!house.isAvailable}
                        >
                          {t("house.bookNow")}
                        </button>
                      )
                    ) : (
                      <Link
                        to={`/login?returnTo=/houses/${house.id}`}
                        className="btn btn-outline phone-btn"
                      >
                        {t("house.bookNow")}
                      </Link>
                    )}
                </div>
              )}
            </div>

            <div className="owner-card">
              <div className="owner-head">
                <span className="owner-avatar">{initials(house.ownerName)}</span>
                <div>
                  <div className="owner-name">{house.ownerName || "Owner"}</div>
                  <div className="owner-role">{t("house.propertyOwner")}</div>
                </div>
              </div>
            </div>

            <div className="tips-card">
              <h3>{t("house.beforeYouRent")}</h3>
              <ul>
                <li>{t("house.tipVisit")}</li>
                <li>{t("house.tipNoTransfer")}</li>
                <li>{t("house.agreeInWriting")}</li>
                <li>{t("house.tipDeposits")}</li>
              </ul>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}
