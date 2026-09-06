import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";

/**
 * The heart. Hidden from a listing's own owner, since saving your own property
 * is refused by the API anyway.
 */
export default function WishlistButton({ houseId, ownerId, className = "" }) {
    const { user } = useAuth();
    const { ids, toggle } = useWishlist();
    const navigate = useNavigate();

    if (user && user.id === ownerId) return null;

    const saved = ids.has(houseId);

    function handleClick(e) {
        // Cards are wrapped in a Link, so without this the click navigates.
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate(`/login?returnTo=/houses/${houseId}`);
            return;
        }

        toggle(houseId);
    }

    return (
        <button
            type="button"
            className={`wish-btn ${saved ? "saved" : ""} ${className}`}
            onClick={handleClick}
            aria-pressed={saved}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            title={saved ? "Saved" : "Save to wishlist"}
        >
            {saved ? "♥" : "♡"}
        </button>
    );
}
