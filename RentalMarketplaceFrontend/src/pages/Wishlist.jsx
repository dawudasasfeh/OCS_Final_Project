import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWishlist } from "../api/wishlist";
import { getErrorMessage } from "../api/errors";
import HouseCard from "../components/HouseCard";
import { useWishlist } from "../context/WishlistContext";

export default function Wishlist() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { ids } = useWishlist();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getWishlist();
        if (!cancelled) setHouses(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Could not load your wishlist."));
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

  return (
    <div className="container section">
      <h1 className="page-title">Saved properties</h1>
      <p className="muted page-sub">
        Listings you have saved. A property that is rejected or taken off the
        market drops out of this list.
      </p>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted">Loading your wishlist…</p>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <p>You have not saved any properties yet.</p>
          <Link to="/houses" className="btn btn-primary">Browse properties</Link>
        </div>
      ) : (
        <div className="grid-houses">
          {visible.map((h) => <HouseCard key={h.id} house={h} />)}
        </div>
      )}
    </div>
  );
}
