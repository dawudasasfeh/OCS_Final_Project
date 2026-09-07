import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMySubscription } from "../api/subscription";
import { useAuth } from "./AuthContext";

const SubscriptionContext = createContext(null);

/**
 * The caller's subscription, read from the API.
 *
 * This exists because "is this user subscribed" is not in the JWT any more. A
 * token is stamped at sign-in and lives for hours, so a claim would still say
 * "no" after an admin confirmed the payment. Reading the server means the gate
 * opens as soon as the payment is confirmed, and `refresh` lets a page that
 * just caused a change ask again without a reload.
 */
export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  // Starts true, not false. The fetch only fires in an effect after the first
  // render, so a false here means the first render reports "not loading, not
  // subscribed" — and every gate reading it redirects a paying owner to the
  // paywall before the answer has even been asked for.
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    try {
      const s = await getMySubscription();
      setSubscription(s);
      return s;
    } catch {
      // A failed read must not be treated as "subscribed" — leave it null and
      // let the gate refuse. The server enforces this rule too.
      setSubscription(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => ({
    subscription,
    isSubscribed: !!subscription?.isActive,
    loading,
    refresh,
  }), [subscription, loading, refresh]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used inside a SubscriptionProvider");
  return ctx;
}
