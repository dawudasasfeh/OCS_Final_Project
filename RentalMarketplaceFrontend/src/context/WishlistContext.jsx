import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getWishlist, addToWishlist, removeFromWishlist } from "../api/wishlist";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

/**
 * Holds the ids of the listings the signed-in user has saved.
 *
 * A heart appears on cards, on the detail page and on the wishlist page itself.
 * Without shared state each would have to ask the server whether this one house
 * is saved, and un-saving on one page would leave the others out of date.
 */
export function WishlistProvider({ children }) {
    const { user } = useAuth();
    const [ids, setIds] = useState(() => new Set());

    useEffect(() => {
        if (!user) {
            setIds(new Set());
            return;
        }

        let cancelled = false;

        getWishlist()
            .then((houses) => {
                if (!cancelled) setIds(new Set(houses.map((h) => h.id)));
            })
            .catch(() => {
                // A failed wishlist must not break the page it sits on.
                if (!cancelled) setIds(new Set());
            });

        return () => { cancelled = true; };
    }, [user]);

    const toggle = useCallback(async (houseId) => {
        const saved = ids.has(houseId);

        // Move first, reconcile after: a heart that waits for the network feels
        // broken. If the call fails the change is rolled back.
        setIds((prev) => {
            const next = new Set(prev);
            saved ? next.delete(houseId) : next.add(houseId);
            return next;
        });

        try {
            await (saved ? removeFromWishlist(houseId) : addToWishlist(houseId));
        } catch {
            setIds((prev) => {
                const next = new Set(prev);
                saved ? next.add(houseId) : next.delete(houseId);
                return next;
            });
        }
    }, [ids]);

    return (
        <WishlistContext.Provider value={{ ids, toggle }}>
            {children}
        </WishlistContext.Provider>
    );
}

export const useWishlist = () => useContext(WishlistContext);
