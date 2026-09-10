import { useState } from "react";
import { Link } from "react-router-dom";
import { imageUrl } from "../utils/images";
import WishlistButton from "./WishlistButton";
import { useTranslation } from "react-i18next";

/** One listing in a grid. Shared by the home page and the search results. */
export default function HouseCard({ house: h }) {
  const { t } = useTranslation();
  const [broken, setBroken] = useState(false);
  const image = h.imageUrls?.[0];

  return (
    <Link to={`/houses/${h.id}`} className="house-card">
      <div className="house-thumb">
        {h.isFurnished && <span className="house-tag">{t("card.furnished")}</span>}
        <WishlistButton houseId={h.id} ownerId={h.ownerId} />
        {image && !broken ? (
          <img src={imageUrl(image)} alt="" onError={() => setBroken(true)} />
        ) : (
          <span>{t("card.photo")}</span>
        )}
      </div>

      <div className="house-body">
        <p className="house-city" dir="auto">
          {t(`city.${h.city}`, { defaultValue: h.city })}{h.neighborhood ? ` · ${h.neighborhood}` : ""}
        </p>
        <h3 className="house-title" dir="auto">{h.title}</h3>
        <div className="house-meta">
          <span>{t("common.beds", { count: h.bedrooms })}</span>
          <span>{t("common.baths", { count: h.bathrooms })}</span>
          <span>{t("common.sqm", { value: h.areaSqM })}</span>
        </div>
        <div className="house-foot">
          <span className="house-price">
            {h.price} {t("common.jod")}{" "}
            <span>{t("card.perUnit", { unit: t(`period.${h.priceUnit.toLowerCase()}`, { defaultValue: h.priceUnit.toLowerCase() }) })}</span>
          </span>
          <span className="house-link">{t("card.viewDetails")}</span>
        </div>
      </div>
    </Link>
  );
}
