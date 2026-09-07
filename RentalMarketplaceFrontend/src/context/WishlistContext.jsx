import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getWishlist, addToWishlist, removeFromWishlist } from "../api/wishlist";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

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
    const toast = useToast();
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
        const undo = () => setIds((prev) => {
            const next = new Set(prev);
            saved ? next.add(houseId) : next.delete(houseId);
            return next;
        });

        // Move first, reconcile after: a heart that waits for the network feels
        // broken. If the call fails the change is rolled back.
        setIds((prev) => {
            const next = new Set(prev);
            saved ? next.delete(houseId) : next.add(houseId);
            return next;
        });

        try {
            await (saved ? removeFromWishlist(houseId) : addToWishlist(houseId));
            toast.success(saved ? "Removed from saved properties." : "Saved.");
        } catch {
            // The heart springing back is easy to miss, so say what happened.
            undo();
            toast.error(
                saved ? "Could not remove that. Please try again."
                      : "Could not save that. Please try again."
            );
        }
    }, [ids, toast]);

    return (
        <WishlistContext.Provider value={{ ids, toggle }}>
            {children}
        </WishlistContext.Provider>
    );
}

export const useWishlist = () => useContext(WishlistContext);
