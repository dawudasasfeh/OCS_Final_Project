import { useState } from "react";
import { Link } from "react-router-dom";
import { imageUrl } from "../utils/images";
import WishlistButton from "./WishlistButton";

/** One listing in a grid. Shared by the home page and the search results. */
export default function HouseCard({ house: h }) {
  const [broken, setBroken] = useState(false);
  const image = h.imageUrls?.[0];

  return (
    <Link to={`/houses/${h.id}`} className="house-card">
      <div className="house-thumb">
        {h.isFurnished && <span className="house-tag">Furnished</span>}
        <WishlistButton houseId={h.id} ownerId={h.ownerId} />
        {image && !broken ? (
          <img src={imageUrl(image)} alt="" onError={() => setBroken(true)} />
        ) : (
          <span>Photo</span>
        )}
      </div>

      <div className="house-body">
        <p className="house-city">
          {h.city}{h.neighborhood ? ` · ${h.neighborhood}` : ""}
        </p>
        <h3 className="house-title">{h.title}</h3>
        <div className="house-meta">
          <span>{h.bedrooms} beds</span>
          <span>{h.bathrooms} baths</span>
          <span>{h.areaSqM} m²</span>
        </div>
        <div className="house-foot">
          <span className="house-price">
            {h.price} JOD <span>/ {h.priceUnit.toLowerCase()}</span>
          </span>
          <span className="house-link">View details</span>
        </div>
      </div>
    </Link>
  );
}
