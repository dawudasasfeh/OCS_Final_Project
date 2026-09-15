import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
    const [ids, setIds] = useState(() => new Set());

    // Another account, or none, must not see the previous one's hearts even
    // for a frame — so this is cleared during render, not in the effect.
    const userId = user?.id ?? null;
    const [heldFor, setHeldFor] = useState(userId);
    if (userId !== heldFor) {
        setHeldFor(userId);
        setIds(new Set());
    }

    useEffect(() => {
        if (!user) return;

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
            toast.success(t(saved ? "wishlist.removed" : "wishlist.saved"));
        } catch {
            // The heart springing back is easy to miss, so say what happened.
            undo();
            toast.error(t(saved ? "wishlist.couldNotRemove" : "wishlist.couldNotSave"));
        }
    }, [ids, toast, t]);

    return (
        <WishlistContext.Provider value={{ ids, toggle }}>
            {children}
        </WishlistContext.Provider>
    );
}

export const useWishlist = () => useContext(WishlistContext);
