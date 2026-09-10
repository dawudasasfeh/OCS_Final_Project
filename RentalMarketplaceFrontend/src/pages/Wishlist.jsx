import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWishlist } from "../api/wishlist";
import { getErrorMessage } from "../api/errors";
import HouseCard from "../components/HouseCard";
import Pagination, { usePaged } from "../components/Pagination";
import { useWishlist } from "../context/WishlistContext";
import { useTranslation } from "react-i18next";

export default function Wishlist() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { ids } = useWishlist();
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getWishlist();
        if (!cancelled) setHouses(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, t("wishlist.couldNotLoad")));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Un-hearting a card removes it here immediately rather than leaving a saved
  // listing on screen with an empty heart. The row is gone on the next load.
  const visible = houses.filter((h) => ids.has(h.id));

  // Twelve, matching the search: these are the same cards in the same grid,
  // and a page that holds twelve on one screen should not hold six on the
  // next. usePaged clamps the page when un-hearting empties the last one.
  const paged = usePaged(visible, 12);

  return (
    <div className="container section">
      <h1 className="page-title">{t("wishlist.title")}</h1>
      <p className="muted page-sub">
        {t("wishlist.sub")}
      </p>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted">{t("wishlist.loading")}</p>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <p>{t("wishlist.empty")}</p>
          <Link to="/houses" className="btn btn-primary">{t("bookings.browse")}</Link>
        </div>
      ) : (
        <>
          <div className="grid-houses">
            {paged.items.map((h) => <HouseCard key={h.id} house={h} />)}
          </div>

          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            onChange={paged.setPage}
            label={t("wishlist.title")}
          />
        </>
      )}
    </div>
  );
}
