import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useSubscription } from "../context/SubscriptionContext"

/**
 * Guards a route.
 *
 *   role                 only this role may enter
 *   requireSubscription  owner pages, which need an active subscription
 *   denyAdmin            renter and owner pages an administrator must not use
 *
 * denyAdmin exists because FR-9.4.2 makes the Admin role oversight only. The
 * navbar and account menu already hide these pages from an admin, but hiding a
 * link is presentation — typing the URL has to be refused too, and the server
 * refuses the same actions independently.
 */
export default function ProtectedRoute({ children, role, requireSubscription, denyAdmin }) {
    const { user } = useAuth();
    const { isSubscribed, loading } = useSubscription();

    if (!user) return <Navigate to="/login" replace />

    if (role && user.role !== role) return <Navigate to="/" replace />

    const isAdmin = user.role === "Admin";

    // Sent to the dashboard rather than home: it is the one place an admin has
    // business being, so the redirect answers "where should I be instead".
    if (denyAdmin && isAdmin) return <Navigate to="/admin" replace />

    if (requireSubscription) {
        if (isAdmin) return <Navigate to="/admin" replace />

        // The subscription is read from the API, so on a cold load it is not
        // known yet. Redirecting during that window would bounce a paying owner
        // to the paywall on every refresh, so wait for the answer first.
        if (loading) return null;
        if (!isSubscribed) return <Navigate to="/subscribe" replace />
    }

    return children;
}
